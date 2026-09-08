type RealtimeSessionInput = {
  model: string;
  question: string;
  role: string | null;
  sessionId: string;
};

export function buildRealtimeSessionPayload(input: RealtimeSessionInput) {
  return {
    session: {
      type: "realtime" as const,
      model: input.model,
      instructions: [
        "Ты голосовой интервьюер Гласно. Всегда говори по-русски, кратко и естественно.",
        "Не отвечай вместо кандидата и не давай готовые решения. Уточняй ответ только по текущему вопросу.",
        "Не переходи к следующему вопросу самостоятельно: это делает приложение по команде пользователя.",
        `ID сессии: ${input.sessionId}.`,
        `Роль кандидата: ${input.role ?? "не указана"}.`,
        `Текущий вопрос: ${input.question}.`,
      ].join("\n"),
      audio: {
        input: {
          noise_reduction: { type: "near_field" },
          transcription: { model: "gpt-4o-mini-transcribe" },
          turn_detection: {
            type: "semantic_vad",
            create_response: true,
            interrupt_response: true,
          },
        },
        output: { voice: "marin" },
      },
    },
  };
}
