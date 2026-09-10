import { fileURLToPath, URL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig, type Plugin } from "vitest/config";

import { extractUploadedText } from "./server/infrastructure/files/extractUploadedText.ts";
import { ApiError } from "./server/utils/apiError.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendProxyTarget = env.VITE_BACKEND_PROXY_TARGET;

  return {
    plugins: [react(), tailwindcss(), localFileExtractionPlugin()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: backendProxyTarget
      ? {
          proxy: {
            "/api": {
              target: backendProxyTarget,
              changeOrigin: true,
            },
          },
        }
      : undefined,
    test: {
      css: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      exclude: ["**/node_modules/**", "**/.git/**", "**/.worktrees/**"],
    },
  };
});

function localFileExtractionPlugin(): Plugin {
  const paths = new Set([
    "/api/interview/resume/extract",
    "/api/interview/custom-questions/extract",
  ]);

  return {
    name: "local-file-extraction",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split("?")[0];
        if (request.method !== "POST" || !pathname || !paths.has(pathname)) {
          next();
          return;
        }

        try {
          const file = await readUploadedFile(request);
          const text = await extractUploadedText({
            data: Buffer.from(await file.arrayBuffer()),
            fileName: file.name,
            mimeType: file.type,
          });
          sendJson(response, 200, { fileName: file.name, text });
        } catch (error) {
          if (isApiError(error)) {
            sendJson(response, error.statusCode, error.data);
            return;
          }

          sendJson(response, 500, {
            code: "E_UNKNOWN",
            message: "Не удалось извлечь текст из файла.",
          });
        }
      });
    },
  };
}

async function readUploadedFile(request: IncomingMessage) {
  const formData = await new Request(`http://localhost${request.url}`, {
    body: request as unknown as ReadableStream,
    duplex: "half",
    headers: request.headers as never,
    method: request.method,
  } as RequestInit & { duplex: "half" }).formData();
  const file = formData.get("file");

  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    throw new ApiError("E_VALIDATION", "Прикрепите файл.");
  }

  return file;
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
