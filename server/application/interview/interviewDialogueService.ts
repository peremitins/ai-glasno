import { apiError } from "../../utils/apiError";
import { assertOwnedInterviewSession } from "./sessionOwnership";

type DialogueRole = "candidate" | "interviewer";
type Owner = { anonymousSessionId: string; userId?: string | null };

type DialogueRepository = {
  findSessionById: (sessionId: string) => Promise<{
    id: string;
    anonymousSessionId: string;
    userId: string | null;
    status: string;
  } | null>;
  findTurnById: (
    sessionId: string,
    turnId: string,
  ) => Promise<{
    id: string;
    sessionId: string;
    metadata: unknown;
  } | null>;
  updateTurnMetadata: (
    sessionId: string,
    turnId: string,
    metadata: Record<string, unknown>,
  ) => Promise<void>;
};

function readMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

export class InterviewDialogueService {
  constructor(private readonly repository: DialogueRepository) {}

  async append(params: {
    content: string;
    owner: Owner;
    role: DialogueRole;
    sessionId: string;
    turnId: string;
  }) {
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
    const dialogue = Array.isArray(metadata.dialogue) ? metadata.dialogue : [];
    await this.repository.updateTurnMetadata(session.id, turn.id, {
      ...metadata,
      dialogue: [
        ...dialogue,
        {
          role: params.role === "candidate" ? "user" : "interviewer",
          content: params.content.trim(),
          at: new Date().toISOString(),
        },
      ],
    });
  }
}
