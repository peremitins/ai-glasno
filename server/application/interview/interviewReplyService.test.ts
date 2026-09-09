import { describe, expect, it } from "vitest";

import { InterviewReplyService } from "./interviewReplyService";

describe("InterviewReplyService", () => {
  it("сохраняет реплики кандидата и интервьюера после завершения потока", async () => {
    let savedMetadata: unknown;
    const service = new InterviewReplyService({
      findSessionById: async () => ({
        id: "session-1",
        anonymousSessionId: "anonymous-1",
        userId: null,
        status: "running",
      }),
      findTurnById: async () => ({
        id: "turn-1",
        sessionId: "session-1",
        question: "Расскажите о проекте?",
        metadata: { dialogue: [] },
      }),
      updateTurnMetadata: async (_sessionId, _turnId, metadata) => {
        savedMetadata = metadata;
      },
    });

    async function* reply() {
      yield "Расскажите ";
      yield "подробнее.";
    }

    const chunks: string[] = [];
    for await (const chunk of service.stream({
      owner: { anonymousSessionId: "anonymous-1", userId: null },
      sessionId: "session-1",
      turnId: "turn-1",
      message: "Я работал над интерфейсом.",
      reply,
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["Расскажите ", "подробнее."]);
    expect(savedMetadata).toMatchObject({
      dialogue: [
        {
          role: "user",
          content: "Я работал над интерфейсом.",
          at: expect.any(String),
        },
        {
          role: "interviewer",
          content: "Расскажите подробнее.",
          at: expect.any(String),
        },
      ],
      hintPack: {
        example: expect.stringContaining("Я работал над интерфейсом."),
      },
    });
  });
});
