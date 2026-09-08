import { z } from "zod";
import { config as loadEnvFile } from "dotenv";

const environmentSchema = z.object({
  NUXT_DATABASE_URL: z.string().min(1, "NUXT_DATABASE_URL обязателен"),
  NUXT_OPENAI_API_KEY: z.string().min(1, "NUXT_OPENAI_API_KEY обязателен"),
  NUXT_OPENAI_MODEL: z.string().min(1, "NUXT_OPENAI_MODEL обязателен"),
  NUXT_OPENAI_REALTIME_MODEL: z.string().min(1).default("gpt-realtime-mini"),
  NUXT_REDIS_URL: z.string().min(1, "NUXT_REDIS_URL обязателен"),
  NUXT_SESSION_SECRET: z.string().min(1, "NUXT_SESSION_SECRET обязателен"),
  NUXT_PUBLIC_API_BASE: z.string().default("/api"),
});

export type RuntimeConfig = {
  server: {
    databaseUrl: string;
    redisUrl: string;
    sessionSecret: string;
    openAi: {
      apiKey: string;
      model: string;
      realtimeModel: string;
    };
  };
  public: {
    apiBase: string;
  };
};

let environmentLoaded = false;

function loadLocalEnvironment() {
  if (environmentLoaded) return;

  const mode =
    process.env.NODE_ENV === "production" ? "production" : "development";
  loadEnvFile({ path: `.env.${mode}`, quiet: true });
  loadEnvFile({ path: ".env", quiet: true });
  environmentLoaded = true;
}

export function readRuntimeConfig(
  environment: Record<string, string | undefined>,
): RuntimeConfig {
  const value = environmentSchema.parse(environment);

  return {
    server: {
      databaseUrl: value.NUXT_DATABASE_URL,
      redisUrl: value.NUXT_REDIS_URL,
      sessionSecret: value.NUXT_SESSION_SECRET,
      openAi: {
        apiKey: value.NUXT_OPENAI_API_KEY,
        model: value.NUXT_OPENAI_MODEL,
        realtimeModel: value.NUXT_OPENAI_REALTIME_MODEL,
      },
    },
    public: {
      apiBase: value.NUXT_PUBLIC_API_BASE,
    },
  };
}

export function getRuntimeConfig() {
  loadLocalEnvironment();
  return readRuntimeConfig(process.env);
}
