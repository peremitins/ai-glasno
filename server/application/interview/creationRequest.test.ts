import { describe, expect, it } from "vitest";

import { normalizeCreationRequest } from "./creationRequest";

describe("normalizeCreationRequest", () => {
  it("преобразует сценарий по профессии в совместимый черновик", () => {
    expect(
      normalizeCreationRequest({
        trainingMode: "candidate",
        source: { type: "profession", role: "Frontend-разработчик" },
        resumeText:
          "Разрабатываю интерфейсы на React и TypeScript более пяти лет.",
        level: "senior",
        sessionGoal: "deep",
        focus: "professional",
        interviewerMode: "strict",
        candidatePersona: "Сильный и краткий",
        questionSourceMode: "custom",
        customQuestionsText: "Расскажите о самом сложном проекте.",
      }),
    ).toMatchObject({
      vacancy: "Frontend-разработчик",
      profile: "Разрабатываю интерфейсы на React и TypeScript более пяти лет.",
      level: "senior",
      questionsCount: 10,
      durationMinutes: 60,
      trainingMode: "candidate",
      sourceType: "profession",
      sessionGoal: "deep",
      interviewerMode: "strict",
      candidatePersona: "Сильный и краткий",
      questionSourceMode: "custom",
    });
  });

  it("задаёт точное количество вопросов для всех целей репетиции", () => {
    expect(
      normalizeCreationRequest({
        source: { type: "text", text: "Вакансия frontend-разработчика" },
        sessionGoal: "quick",
      }),
    ).toMatchObject({ questionsCount: 3, durationMinutes: 15 });
    expect(
      normalizeCreationRequest({
        source: { type: "text", text: "Вакансия frontend-разработчика" },
        sessionGoal: "standard",
      }),
    ).toMatchObject({ questionsCount: 6, durationMinutes: 45 });
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
    ).toMatchObject({
      vacancy: "Senior Frontend Developer",
      questionsCount: 10,
    });
  });
});
