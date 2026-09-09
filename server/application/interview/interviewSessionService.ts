import { apiError } from "../../utils/apiError";
import { assertOwnedInterviewSession } from "./sessionOwnership";
import { toInterviewState } from "./interviewState";

type SessionRecord = {
  id: string;
  status: string;
  anonymousSessionId: string;
  userId: string | null;
  questionCount: number;
  vacancyTitle: string | null;
  role: string | null;
  metadata: unknown;
};

type TurnRecord = {
  id: string;
  sessionId: string;
  index: number;
  kind: string;
  question: string;
  answerTranscript: string | null;
  metadata: unknown;
};

type PlanItem = { id: string; question: string };

type HintPack = {
  bullets: string[];
  focus: string;
  structure: string;
};

type InterviewSessionRepository = {
  findSessionById: (sessionId: string) => Promise<SessionRecord | null>;
  listTurns: (sessionId: string) => Promise<TurnRecord[]>;
  findTurnById: (
    sessionId: string,
    turnId: string,
  ) => Promise<TurnRecord | null>;
  saveTurnAnswer: (
    sessionId: string,
    turnId: string,
    answer: string,
  ) => Promise<void>;
  createTurn: (turn: Omit<TurnRecord, "id">) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
};

type Owner = { anonymousSessionId: string; userId?: string | null };

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readPlanItems(metadata: unknown): PlanItem[] {
  const plan = readRecord(readRecord(metadata).plan);
  if (!Array.isArray(plan.items)) return [];

  return plan.items.flatMap((item) => {
    const value = readRecord(item);
    const id = typeof value.id === "string" ? value.id : "";
    const question =
      typeof value.question === "string" ? value.question.trim() : "";
    return id && question ? [{ id, question }] : [];
  });
}

function readDialogueAnswer(metadata: unknown) {
  const dialogue = readRecord(metadata).dialogue;
  if (!Array.isArray(dialogue)) return "";

  return dialogue
    .flatMap((entry) => {
      const message = readRecord(entry);
      return message.role === "user" && typeof message.content === "string"
        ? [message.content.trim()]
        : [];
    })
    .filter(Boolean)
    .join("\n");
}

function buildHintPack(question: string, role: string | null): HintPack {
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

export class InterviewSessionService {
  constructor(private readonly repository: InterviewSessionRepository) {}

  async nextQuestion(params: {
    owner: Owner;
    sessionId: string;
    turnId: string;
    dialogueAnswer?: string;
  }) {
    const session = await this.requireRunningSession(
      params.owner,
      params.sessionId,
    );
    const turn = await this.requireTurn(session.id, params.turnId);
    await this.finalizeTurn(session.id, turn, params.dialogueAnswer);

    const turns = await this.repository.listTurns(session.id);
    const nextPlanItem = this.findNextPlanItem(session.metadata, turns);
    if (!nextPlanItem) {
      await this.repository.completeSession(session.id);
    } else {
      await this.repository.createTurn({
        sessionId: session.id,
        index: this.nextTurnIndex(turns),
        kind: "main",
        question: nextPlanItem.question,
        answerTranscript: null,
        metadata: {
          planItemId: nextPlanItem.id,
          hintPack: buildHintPack(nextPlanItem.question, session.role),
          dialogue: [
            {
              role: "interviewer",
              content: nextPlanItem.question,
              at: new Date().toISOString(),
            },
          ],
        },
      });
    }

    return this.getState(params.owner, session.id);
  }

  async finish(params: { owner: Owner; sessionId: string; turnId?: string }) {
    const session = assertOwnedInterviewSession(
      await this.repository.findSessionById(params.sessionId),
      params.owner,
    );
    if (session.status === "done")
      return this.getState(params.owner, session.id);
    if (session.status !== "running") {
      throw apiError("E_CONFLICT", "Интервью ещё не начато");
    }

    const turn = params.turnId
      ? await this.requireTurn(session.id, params.turnId)
      : (await this.repository.listTurns(session.id)).find(
          (item) => !item.answerTranscript,
        );
    if (!turn) throw apiError("E_NOT_FOUND", "Вопрос не найден");
    await this.finalizeTurn(session.id, turn);
    await this.repository.completeSession(session.id);
    return this.getState(params.owner, session.id);
  }

  private async getState(owner: Owner, sessionId: string) {
    const session = assertOwnedInterviewSession(
      await this.repository.findSessionById(sessionId),
      owner,
    );
    return toInterviewState(
      session,
      await this.repository.listTurns(session.id),
    );
  }

  private async requireRunningSession(owner: Owner, sessionId: string) {
    const session = assertOwnedInterviewSession(
      await this.repository.findSessionById(sessionId),
      owner,
    );
    if (session.status !== "running") {
      throw apiError("E_CONFLICT", "Интервью уже завершено");
    }
    return session;
  }

  private async requireTurn(sessionId: string, turnId: string) {
    const turn = await this.repository.findTurnById(sessionId, turnId);
    if (!turn) throw apiError("E_NOT_FOUND", "Вопрос не найден");
    return turn;
  }

  private async finalizeTurn(
    sessionId: string,
    turn: TurnRecord,
    dialogueAnswer?: string,
  ) {
    if (turn.answerTranscript) return;
    const answer = dialogueAnswer?.trim() || readDialogueAnswer(turn.metadata);
    await this.repository.saveTurnAnswer(
      sessionId,
      turn.id,
      answer || "Ответ не указан",
    );
  }

  private findNextPlanItem(metadata: unknown, turns: TurnRecord[]) {
    const usedPlanItemIds = new Set(
      turns
        .map((turn) => readRecord(turn.metadata).planItemId)
        .filter((value): value is string => typeof value === "string"),
    );
    return readPlanItems(metadata).find(
      (item) => !usedPlanItemIds.has(item.id),
    );
  }

  private nextTurnIndex(turns: TurnRecord[]) {
    return Math.max(0, ...turns.map((turn) => turn.index)) + 1;
  }
}
