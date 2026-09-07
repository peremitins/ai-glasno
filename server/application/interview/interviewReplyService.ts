import { apiError } from "../../utils/apiError";
import { assertOwnedInterviewSession } from "./sessionOwnership";

type Owner = { anonymousSessionId: string; userId?: string | null };

type ReplyRepository = {
  findSessionById: (sessionId: string) => Promise<{
    id: string;
    anonymousSessionId: string;
    userId: string | null;
    status: string;
  } | null>;
  findTurnById: (
    sessionId: string,
    turnId: string,
  ) => Promise<{ id: string; sessionId: string; metadata: unknown } | null>;
  updateTurnMetadata: (
    sessionId: string,
    turnId: string,
    metadata: Record<string, unknown>,
  ) => Promise<void>;
};

type DialogueMessage = {
  role: "user" | "interviewer";
  content: string;
  at: string;
};

function readMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function readDialogue(value: unknown): DialogueMessage[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const message = readMetadata(item);
    const content =
      typeof message.content === "string" ? message.content.trim() : "";
    if (!content) return [];
    return [
      {
        role: message.role === "interviewer" ? "interviewer" : "user",
        content,
        at:
          typeof message.at === "string"
            ? message.at
            : new Date().toISOString(),
      },
    ];
  });
}

export class InterviewReplyService {
  constructor(private readonly repository: ReplyRepository) {}

  async *stream(params: {
    owner: Owner;
    sessionId: string;
    turnId: string;
    message: string;
    reply: () => AsyncGenerator<string, void, void>;
  }): AsyncGenerator<string, void, void> {
    const session = assertOwnedInterviewSession(
      await this.repository.findSessionById(params.sessionId),
      params.owner,
    );
    if (session.status !== "running") {
      throw apiError("E_CONFLICT", "Интервью уже завершено");
    }

    const turn = await this.repository.findTurnById(session.id, params.turnId);
    if (!turn) throw apiError("E_NOT_FOUND", "Вопрос не найден");

    const metadata = readMetadata(turn.metadata);
    const dialogue = readDialogue(metadata.dialogue);
    dialogue.push({
      role: "user",
      content: params.message.trim(),
      at: new Date().toISOString(),
    });

    let fullReply = "";
    for await (const chunk of params.reply()) {
      fullReply += chunk;
      yield chunk;
    }

    const reply = fullReply.trim();
    if (!reply) {
      throw apiError("E_UPSTREAM", "Провайдер вернул пустой ответ интервьюера");
    }

    dialogue.push({
      role: "interviewer",
      content: reply,
      at: new Date().toISOString(),
    });
    await this.repository.updateTurnMetadata(session.id, turn.id, {
      ...metadata,
      dialogue,
    });
  }
}
