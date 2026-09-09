import { describe, expect, it } from "vitest";

import { InterviewCreationService } from "./interviewCreationService";

describe("InterviewCreationService", () => {
  it("создаёт сессию и первый вопрос для владельца", async () => {
    const created: Array<Record<string, unknown>> = [];
    const service = new InterviewCreationService({
      createSession: async (input) => {
        created.push(input);
        return { id: "session-1", ...input };
      },
      createTurn: async (input) => {
        created.push(input);
      },
    });

    const state = await service.create({
      owner: { anonymousSessionId: "anonymous-1", userId: null },
      draft: {
        vacancy: "Frontend-разработчик React и TypeScript",
        profile: "Разрабатываю интерфейсы и проектирую клиентские приложения.",
        format: "technical",
        level: "middle",
        questionsCount: 5,
        durationMinutes: 30,
        includeHints: true,
      },
    });

    expect(state.session.id).toBe("session-1");
    expect(state.currentTurn?.index).toBe(1);
    expect(state.currentTurn?.question).toContain("Frontend-разработчик");
    expect(state.currentTurn?.hintPack).toMatchObject({
      structure: expect.any(String),
      bullets: expect.arrayContaining([expect.any(String)]),
    });
    expect(created).toHaveLength(2);
  });

  it("сохраняет настройки расширенного сценария в сессии", async () => {
    const created: Array<Record<string, unknown>> = [];
    const service = new InterviewCreationService({
      createSession: async (input) => {
        created.push(input);
        return { id: "session-2", ...input };
      },
      createTurn: async (input) => {
        created.push(input);
      },
    });

    await service.create({
      owner: { anonymousSessionId: "anonymous-1", userId: null },
      draft: {
        vacancy: "Senior Frontend-разработчик",
        profile:
          "Создаю интерфейсы и развиваю архитектуру клиентских приложений.",
        format: "technical",
        level: "senior",
        questionsCount: 10,
        durationMinutes: 45,
        includeHints: true,
        trainingMode: "interviewer",
        sourceType: "profession",
        sessionGoal: "standard",
        interviewerMode: "strict",
        focus: "professional",
      },
    });

    expect(created[0]).toMatchObject({
      trainingMode: "interviewer",
      source: "profession",
      interviewerMode: "strict",
      metadata: { sessionGoal: "standard", focus: "professional" },
    });
  });
});
