import { describe, expect, it } from "vitest";

import { resolveInterviewEndpoint } from "./sessionApi";

describe("resolveInterviewEndpoint", () => {
  it("не дублирует сегмент interview, когда он уже находится в base URL", () => {
    expect(
      resolveInterviewEndpoint(
        "resume/extract",
        "http://localhost/api/interview",
      ),
    ).toBe("resume/extract");
  });

  it("добавляет сегмент interview для общего API base URL", () => {
    expect(
      resolveInterviewEndpoint("resume/extract", "http://localhost/api"),
    ).toBe("interview/resume/extract");
  });
});
