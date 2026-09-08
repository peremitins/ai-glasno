import { describe, expect, it } from "vitest";

import { toInterviewState } from "./interviewState";
import { assertOwnedInterviewSession } from "./sessionOwnership";

describe("состояние интервью", () => {
  const session = {
    id: "session-01",
    anonymousSessionId: "anonymous-01",
    userId: null,
    status: "running",
    vacancyTitle: "Senior Frontend Developer",
    role: "Frontend-разработчик",
    questionCount: 3,
  };

  it("не раскрывает интервью другой анонимной сессии", () => {
    expect(() =>
      assertOwnedInterviewSession(session, {
        anonymousSessionId: "anonymous-02",
      }),
    ).toThrow("Нет доступа к этому интервью");
  });

  it("отдаёт активный вопрос и сообщения в формате API", () => {
    const result = toInterviewState(session, [
      {
        id: "turn-01",
        sessionId: "session-01",
        index: 1,
        kind: "main",
        question: "Как React повторно рендерит компонент?",
        answerTranscript: null,
        metadata: {
          dialogue: [
            {
              role: "interviewer",
              content: "Расскажите о повторном рендере.",
              at: "2026-09-06T10:00:00.000Z",
            },
          ],
          hintPack: { structure: "Начните с state и props." },
        },
      },
    ]);

    expect(result).toMatchObject({
      session: {
        id: "session-01",
        status: "running",
        totalQuestions: 3,
      },
      currentTurn: {
        id: "turn-01",
        hintPack: { structure: "Начните с state и props." },
        messages: [
          {
            role: "interviewer",
            content: "Расскажите о повторном рендере.",
          },
        ],
      },
    });
  });
});
