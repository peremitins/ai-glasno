import { getRuntimeConfig } from "../../config/runtimeConfig";
import { apiError } from "../../utils/apiError";

const RESPONSES_URL = "https://api.openai.com/v1/responses";

type ResponseDelta =
  { type: "delta"; text: string } | { type: "error"; message: string } | null;

export function readResponseDelta(payload: string): ResponseDelta {
  let value: unknown;
  try {
    value = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;

  const event = value as {
    type?: unknown;
    delta?: unknown;
    error?: { message?: unknown };
  };
  if (
    event.type === "response.output_text.delta" &&
    typeof event.delta === "string"
  ) {
    return { type: "delta", text: event.delta };
  }
  if (
    (event.type === "error" || event.type === "response.error") &&
    typeof event.error?.message === "string"
  ) {
    return { type: "error", message: event.error.message };
  }
  return null;
}

function buildInstruction(input: {
  role: string | null;
  question: string;
  dialogue: Array<{ role: "user" | "interviewer"; content: string }>;
}) {
  const dialogue = input.dialogue
    .map(
      (message) =>
        `${message.role === "user" ? "Кандидат" : "Интервьюер"}: ${message.content}`,
    )
    .join("\n");

  return [
    "Ты проводишь профессиональное интервью на русском языке.",
    "Задавай короткие и содержательные уточняющие вопросы по текущей теме.",
    "Не выдумывай факты о кандидате и не переходи к следующему вопросу самостоятельно.",
    input.role ? `Роль: ${input.role}.` : "Роль не указана.",
    `Текущий вопрос: ${input.question}`,
    dialogue ? `Диалог:\n${dialogue}` : "Диалог пока не начат.",
  ].join("\n\n");
}

function getSsePayloads(buffer: string) {
  return buffer
    .split("\n\n")
    .map((event) =>
      event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s?/, ""))
        .join("\n"),
    )
    .filter(Boolean);
}

export class InterviewResponder {
  async *stream(input: {
    role: string | null;
    question: string;
    message: string;
    dialogue: Array<{ role: "user" | "interviewer"; content: string }>;
  }): AsyncGenerator<string, void, void> {
    const config = getRuntimeConfig();
    const response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.server.openAi.apiKey}`,
        "content-type": "application/json",
        accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: config.server.openAi.model,
        stream: true,
        max_output_tokens: 380,
        input: [
          {
            role: "developer",
            content: [{ type: "input_text", text: buildInstruction(input) }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Сформулируй следующую реплику интервьюера.",
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok || !response.body) {
      throw apiError("E_UPSTREAM", "Не удалось получить ответ интервьюера");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      const boundary = buffer.lastIndexOf("\n\n");
      if (boundary < 0) continue;

      const events = getSsePayloads(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      for (const event of events) {
        const delta = readResponseDelta(event);
        if (delta?.type === "error")
          throw apiError("E_UPSTREAM", delta.message);
        if (delta?.type === "delta") yield delta.text;
      }
    }

    for (const event of getSsePayloads(buffer + decoder.decode())) {
      const delta = readResponseDelta(event);
      if (delta?.type === "error") throw apiError("E_UPSTREAM", delta.message);
      if (delta?.type === "delta") yield delta.text;
    }
  }
}
