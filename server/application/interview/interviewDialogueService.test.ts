import { describe, expect, it, vi } from "vitest";

import { InterviewDialogueService } from "./interviewDialogueService";

describe("сохранение реплики realtime-диалога", () => {
  it("добавляет распознанную реплику только в текущий вопрос владельца", async () => {
    const updateTurnMetadata = vi.fn();
    const service = new InterviewDialogueService({
      findSessionById: vi.fn(async () => ({
        anonymousSessionId: "anonymous-owner",
        id: "session-01",
        status: "running",
        userId: null,
      })),
      findTurnById: vi.fn(async () => ({
        id: "turn-01",
        question: "Как вы измерили эффект?",
        metadata: { hintPack: { structure: "STAR" } },
        sessionId: "session-01",
      })),
      updateTurnMetadata,
    });

    await service.append({
      content: "Я внедрил дизайн-систему.",
      owner: { anonymousSessionId: "anonymous-owner" },
      role: "candidate",
      sessionId: "session-01",
      turnId: "turn-01",
    });

    expect(updateTurnMetadata).toHaveBeenCalledWith(
      "session-01",
      "turn-01",
      expect.objectContaining({
        hintPack: expect.objectContaining({
          example: expect.stringContaining("Я внедрил дизайн-систему."),
        }),
        dialogue: [
          expect.objectContaining({
            content: "Я внедрил дизайн-систему.",
            role: "user",
          }),
        ],
      }),
    );
  });
});
