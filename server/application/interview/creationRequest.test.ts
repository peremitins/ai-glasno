import { describe, expect, it } from "vitest";

import { normalizeCreationRequest } from "./creationRequest";

describe("normalizeCreationRequest", () => {
  it("преобразует сценарий по профессии в совместимый черновик", () => {
    expect(
      normalizeCreationRequest({
        trainingMode: "candidate",
        source: { type: "profession", role: "Frontend-разработчик" },
        resumeText: "Разрабатываю интерфейсы на React и TypeScript более пяти лет.",
        level: "senior",
        sessionGoal: "deep",
        focus: "professional",
        interviewerMode: "strict",
      }),
    ).toMatchObject({
      vacancy: "Frontend-разработчик",
      profile: "Разрабатываю интерфейсы на React и TypeScript более пяти лет.",
      level: "senior",
      questionsCount: 15,
      durationMinutes: 60,
      trainingMode: "candidate",
      sourceType: "profession",
      sessionGoal: "deep",
      interviewerMode: "strict",
    });
  });

  it("сохраняет совместимость с базовым черновиком", () => {
    expect(
      normalizeCreationRequest({
        vacancy: "Senior Frontend Developer",
        profile: "Разрабатываю приложения на React и TypeScript.",
        format: "technical",
        level: "middle",
        questionsCount: 10,
        durationMinutes: 45,
        includeHints: true,
      }),
    ).toMatchObject({ vacancy: "Senior Frontend Developer", questionsCount: 10 });
  });
});
