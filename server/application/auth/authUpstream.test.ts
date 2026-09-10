import { describe, expect, it } from "vitest";

import { resolveAuthUpstreamUrl } from "./authUpstream";

describe("resolveAuthUpstreamUrl", () => {
  it("строит маршрут авторизации на внутреннем upstream", () => {
    expect(
      resolveAuthUpstreamUrl("email/start", "http://web:3000/"),
    ).toBe("http://web:3000/api/auth/email/start");
  });
});
