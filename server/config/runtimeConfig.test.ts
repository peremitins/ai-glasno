import { describe, expect, it } from "vitest";

import { readRuntimeConfig } from "./runtimeConfig";

describe("readRuntimeConfig", () => {
  it("читает серверные переменные прежнего формата и не раскрывает секреты", () => {
    const config = readRuntimeConfig({
      GLASNO_DATABASE_URL: "postgres://user:password@localhost:5432/glasno",
      GLASNO_OPENAI_API_KEY: "secret-api-key",
      GLASNO_OPENAI_MODEL: "gpt-5-mini",
      GLASNO_REDIS_URL: "redis://localhost:6379",
      GLASNO_SESSION_SECRET: "session-secret",
      GLASNO_PUBLIC_API_BASE: "/api",
    });

    expect(config.server.openAi.apiKey).toBe("secret-api-key");
    expect(config.server.openAi.realtimeModel).toBe("gpt-realtime-mini");
    expect(config.server.databaseUrl).toContain("postgres://");
    expect(config.public).toEqual({ apiBase: "/api" });
    expect(JSON.stringify(config.public)).not.toContain("secret");
    expect(JSON.stringify(config.public)).not.toContain("postgres");
  });

  it("сообщает, если для серверного запуска не хватает обязательного секрета", () => {
    expect(() =>
      readRuntimeConfig({
        GLASNO_DATABASE_URL: "postgres://localhost/glasno",
        GLASNO_OPENAI_MODEL: "gpt-5-mini",
        GLASNO_REDIS_URL: "redis://localhost:6379",
        GLASNO_SESSION_SECRET: "session-secret",
      }),
    ).toThrow("GLASNO_OPENAI_API_KEY");
  });
});
