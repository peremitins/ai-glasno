import { describe, expect, it } from "vitest";

import { InterviewSessionService } from "./interviewSessionService";

type Session = {
  id: string;
  anonymousSessionId: string;
  userId: string | null;
  status: string;
  questionCount: number;
  vacancyTitle: string | null;
  role: string | null;
  metadata: unknown;
};

type Turn = {
  id: string;
  sessionId: string;
  index: number;
  kind: string;
  question: string;
  answerTranscript: string | null;
  metadata: unknown;
};

function createRepository() {
  const session: Session = {
    id: "session-1",
    anonymousSessionId: "anonymous-1",
    userId: null,
    status: "running",
    questionCount: 2,
    vacancyTitle: "Frontend-разработчик",
    role: "Frontend-разработчик",
    metadata: {
      plan: {
        items: [
          { id: "plan-1", question: "Расскажите о последнем проекте?" },
          { id: "plan-2", question: "Как вы проверяете качество кода?" },
        ],
      },
    },
  };
  const turns: Turn[] = [
    {
      id: "turn-1",
      sessionId: session.id,
      index: 1,
      kind: "main",
      question: "Расскажите о последнем проекте?",
      answerTranscript: null,
      metadata: { planItemId: "plan-1", dialogue: [] },
    },
  ];

  return {
    findSessionById: async () => session,
    listTurns: async () => turns,
    findTurnById: async (_sessionId: string, turnId: string) =>
      turns.find((turn) => turn.id === turnId) ?? null,
    saveTurnAnswer: async (
      _sessionId: string,
      turnId: string,
      answer: string,
    ) => {
      const turn = turns.find((item) => item.id === turnId);
      if (turn) turn.answerTranscript = answer;
    },
    createTurn: async (input: Omit<Turn, "id">) => {
      turns.push({ ...input, id: `turn-${turns.length + 1}` });
    },
    completeSession: async () => {
      session.status = "done";
    },
  };
}

describe("InterviewSessionService", () => {
  it("переходит к следующему вопросу и сохраняет ответ из диалога", async () => {
    const repository = createRepository();
    const service = new InterviewSessionService(repository);

    const state = await service.nextQuestion({
      owner: { anonymousSessionId: "anonymous-1", userId: null },
      sessionId: "session-1",
      turnId: "turn-1",
      dialogueAnswer: "Я отвечал за архитектуру и внедрение тестов.",
    });

    expect(state.currentTurn?.question).toBe(
      "Как вы проверяете качество кода?",
    );
    expect(state.turns[0]?.answerTranscript).toBe(
      "Я отвечал за архитектуру и внедрение тестов.",
    );
  });

  it("завершает сессию, если в плане нет следующего вопроса", async () => {
    const repository = createRepository();
    const service = new InterviewSessionService(repository);

    await service.nextQuestion({
      owner: { anonymousSessionId: "anonymous-1", userId: null },
      sessionId: "session-1",
      turnId: "turn-1",
    });
    const state = await service.nextQuestion({
      owner: { anonymousSessionId: "anonymous-1", userId: null },
      sessionId: "session-1",
      turnId: "turn-2",
    });

    expect(state.session.status).toBe("done");
    expect(state.currentTurn).toBeNull();
  });

  it("завершает текущий вопрос, когда клиент не передал его id", async () => {
    const repository = createRepository();
    const service = new InterviewSessionService(repository);

    const state = await service.finish({
      owner: { anonymousSessionId: "anonymous-1", userId: null },
      sessionId: "session-1",
    });

    expect(state.session.status).toBe("done");
    expect(state.turns[0]?.answerTranscript).toBe("Ответ не указан");
  });
});
