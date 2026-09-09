export type InterviewHintPack = {
  bullets: string[];
  focus: string;
  structure: string;
  example: string;
};

export function buildInterviewHintPack(
  question: string,
  role: string | null,
  answerContext?: string,
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
    example: answerContext
      ? `В развитии ответа «${answerContext}» я бы явно обозначил контекст задачи «${question}», личную роль, принятые решения и измеримый результат.`
      : `В похожей ситуации я сначала определил контекст задачи «${question}», затем выбрал измеримые критерии, согласовал решение с командой и проверил результат после внедрения.`,
  };
}
