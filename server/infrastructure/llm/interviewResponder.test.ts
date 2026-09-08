import { describe, expect, it } from "vitest";

import { readResponseDelta } from "./interviewResponder";

describe("readResponseDelta", () => {
  it("извлекает текстовую дельту Responses API", () => {
    expect(
      readResponseDelta(
        JSON.stringify({
          type: "response.output_text.delta",
          delta: "Уточните, пожалуйста, пример.",
        }),
      ),
    ).toEqual({ type: "delta", text: "Уточните, пожалуйста, пример." });
  });

  it("возвращает ошибку провайдера", () => {
    expect(
      readResponseDelta(
        JSON.stringify({
          type: "error",
          error: { message: "Лимит временно исчерпан" },
        }),
      ),
    ).toEqual({ type: "error", message: "Лимит временно исчерпан" });
  });
});
