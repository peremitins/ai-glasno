import { afterEach, describe, expect, it } from "vitest";

import { appendCsrfHeader } from "./csrf";

describe("appendCsrfHeader", () => {
  afterEach(() => {
    document.cookie = "glasno_csrf=; Max-Age=0; path=/";
  });

  it("добавляет CSRF-токен из cookie к небезопасному запросу", () => {
    document.cookie = "glasno_csrf=csrf-history-token; path=/";

    const headers = appendCsrfHeader(new Headers());

    expect(headers.get("x-csrf-token")).toBe("csrf-history-token");
  });
});
