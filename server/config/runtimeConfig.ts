import { z } from "zod";
import { config as loadEnvFile } from "dotenv";

const environmentSchema = z.object({
  GLASNO_DATABASE_URL: z.string().min(1, "GLASNO_DATABASE_URL обязателен"),
  GLASNO_OPENAI_API_KEY: z.string().min(1, "GLASNO_OPENAI_API_KEY обязателен"),
  GLASNO_OPENAI_MODEL: z.string().min(1, "GLASNO_OPENAI_MODEL обязателен"),
  GLASNO_OPENAI_REALTIME_MODEL: z.string().min(1).default("gpt-realtime-mini"),
  GLASNO_REDIS_URL: z.string().min(1, "GLASNO_REDIS_URL обязателен"),
  GLASNO_SESSION_SECRET: z.string().min(1, "GLASNO_SESSION_SECRET обязателен"),
  GLASNO_PUBLIC_API_BASE: z.string().default("/api"),
  AI_USE_RELAY: z.enum(["true", "false"]).default("false"),
  AI_RELAY_URL: z.string().default(""),
  AI_RELAY_AUTH_SECRET: z.string().default(""),
  AI_RELAY_CLIENT_ID: z.string().default(""),
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
    aiRelay: {
      authSecret: string;
      clientId: string;
      enabled: boolean;
      url: string;
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
      databaseUrl: value.GLASNO_DATABASE_URL,
      redisUrl: value.GLASNO_REDIS_URL,
      sessionSecret: value.GLASNO_SESSION_SECRET,
      openAi: {
        apiKey: value.GLASNO_OPENAI_API_KEY,
        model: value.GLASNO_OPENAI_MODEL,
        realtimeModel: value.GLASNO_OPENAI_REALTIME_MODEL,
      },
      aiRelay: {
        authSecret: value.AI_RELAY_AUTH_SECRET,
        clientId: value.AI_RELAY_CLIENT_ID,
        enabled: value.AI_USE_RELAY === "true" || Boolean(value.AI_RELAY_URL),
        url: value.AI_RELAY_URL.replace(/\/+$/, ""),
      },
    },
    public: {
      apiBase: value.GLASNO_PUBLIC_API_BASE,
    },
  };
}

export function getRuntimeConfig() {
  loadLocalEnvironment();
  return readRuntimeConfig(process.env);
}
