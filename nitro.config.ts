import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  compatibilityDate: "2026-09-06",
  serverDir: "server",
  devServer: {
    host: "127.0.0.1",
    port: Number(process.env.NITRO_PORT ?? 3000),
  },
  dotenv: {
    fileName: [".env", ".env.local", ".env.development"],
  },
});
