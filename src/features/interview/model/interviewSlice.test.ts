import { describe, expect, it } from "vitest";

import {
  clearSessionAnswerDraft,
  interviewReducer,
  setSessionAnswerDraft,
} from "./interviewSlice";

describe("interviewSlice", () => {
  it("хранит черновики ответов отдельно для каждой сессии", () => {
    const withFirstDraft = interviewReducer(
      undefined,
      setSessionAnswerDraft({ sessionId: "session-1", value: "Первый ответ" }),
    );
    const withBothDrafts = interviewReducer(
      withFirstDraft,
      setSessionAnswerDraft({ sessionId: "session-2", value: "Второй ответ" }),
    );

    expect(withBothDrafts.answerDrafts).toEqual({
      "session-1": "Первый ответ",
      "session-2": "Второй ответ",
    });
  });

  it("очищает только отправленный черновик", () => {
    const state = interviewReducer(
      {
        answerDraft: "",
        answerDrafts: { "session-1": "Первый", "session-2": "Второй" },
        draft: {
          durationMinutes: 45,
          format: "technical",
          includeHints: true,
          level: "middle",
          profile: "",
          questionsCount: 10,
          vacancy: "",
        },
        hintsOpen: false,
      },
      clearSessionAnswerDraft("session-1"),
    );

    expect(state.answerDrafts).toEqual({ "session-2": "Второй" });
  });
});
