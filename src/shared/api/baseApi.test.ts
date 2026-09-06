import { describe, expect, it } from "vitest";

import { normalizeApiBaseUrl } from "./baseApi";

describe("normalizeApiBaseUrl", () => {
  it("приводит относительный адрес API к текущему origin", () => {
    expect(normalizeApiBaseUrl("/api/interview", "http://localhost:5173")).toBe(
      "http://localhost:5173/api/interview",
    );
  });

  it("сохраняет абсолютный адрес API", () => {
    expect(
      normalizeApiBaseUrl(
        "https://api.example.test/interview/",
        "http://localhost:5173",
      ),
    ).toBe("https://api.example.test/interview");
  });
});
