import { describe, expect, it } from "vitest";

import { shouldUseSecureCookie } from "./session";

describe("shouldUseSecureCookie", () => {
  it("не помечает cookie как Secure для локального HTTP-запроса", () => {
    expect(shouldUseSecureCookie("http")).toBe(false);
  });

  it("помечает cookie как Secure для HTTPS-запроса", () => {
    expect(shouldUseSecureCookie("https")).toBe(true);
  });
});
