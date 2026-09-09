export type InterviewHintPack = {
  bullets: string[];
  focus: string;
  structure: string;
};

export function buildInterviewHintPack(
  question: string,
  role: string | null,
): InterviewHintPack {
  const subject = role?.trim() || "вашу профессиональную практику";
  return {
    focus: `Покажите, как ваш опыт связан с ролью «${subject}».`,
    structure:
      "Ответьте по схеме: контекст → ваша задача → конкретные действия → измеримый результат → вывод.",
    bullets: [
      `Сначала уточните контекст вопроса: «${question}».`,
      "Назовите личный вклад, а не только действия команды.",
      "Подкрепите ответ конкретным примером и результатом.",
    ],
  };
}
