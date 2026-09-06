import { describe, expect, it } from "vitest";

import healthHandler from "../../server/api/health.get";

describe("GET /api/health", () => {
  it("возвращает статус работающего серверного слоя", async () => {
    expect(await healthHandler()).toEqual({ status: "ok" });
  });
});
