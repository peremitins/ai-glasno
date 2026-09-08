type SessionRecord = {
  id: string;
  status: string;
  vacancyTitle: string | null;
  role: string | null;
  questionCount: number;
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

type DialogueMessage = {
  role: "user" | "interviewer";
  content: string;
  at: string;
};

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readDialogue(value: unknown): DialogueMessage[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    const item = readRecord(entry);
    const content = typeof item.content === "string" ? item.content : "";
    if (!content) return [];

    return [
      {
        role: item.role === "interviewer" ? "interviewer" : "user",
        content,
        at: typeof item.at === "string" ? item.at : new Date(0).toISOString(),
      },
    ];
  });
}

function readHintPack(value: unknown) {
  const hintPack = readRecord(value);
  return typeof hintPack.structure === "string" ? hintPack : null;
}

export function toInterviewState(session: SessionRecord, turns: TurnRecord[]) {
  const orderedTurns = [...turns].sort(
    (left, right) => left.index - right.index,
  );
  const currentTurn =
    session.status === "running"
      ? (orderedTurns.find((turn) => !turn.answerTranscript) ?? null)
      : null;

  return {
    session: {
      id: session.id,
      status: session.status,
      vacancyTitle: session.vacancyTitle,
      role: session.role,
      totalQuestions: session.questionCount,
    },
    turns: orderedTurns.map((turn) => {
      const metadata = readRecord(turn.metadata);
      return {
        id: turn.id,
        sessionId: turn.sessionId,
        index: turn.index,
        kind: turn.kind,
        question: turn.question,
        answerTranscript: turn.answerTranscript,
        hintPack: readHintPack(metadata.hintPack),
        messages: readDialogue(metadata.dialogue),
      };
    }),
    currentTurn: currentTurn
      ? (() => {
          const metadata = readRecord(currentTurn.metadata);
          return {
            id: currentTurn.id,
            sessionId: currentTurn.sessionId,
            index: currentTurn.index,
            kind: currentTurn.kind,
            question: currentTurn.question,
            answerTranscript: currentTurn.answerTranscript,
            hintPack: readHintPack(metadata.hintPack),
            messages: readDialogue(metadata.dialogue),
          };
        })()
      : null,
  };
}
