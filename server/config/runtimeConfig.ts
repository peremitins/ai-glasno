import { z } from "zod";

const environmentSchema = z.object({
  NUXT_DATABASE_URL: z.string().min(1, "NUXT_DATABASE_URL обязателен"),
  NUXT_OPENAI_API_KEY: z.string().min(1, "NUXT_OPENAI_API_KEY обязателен"),
  NUXT_OPENAI_MODEL: z.string().min(1, "NUXT_OPENAI_MODEL обязателен"),
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
    };
  };
  public: {
    apiBase: string;
  };
};

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
      },
    },
    public: {
      apiBase: value.NUXT_PUBLIC_API_BASE,
    },
  };
}
