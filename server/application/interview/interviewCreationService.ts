type Draft = {
  vacancy: string;
  profile: string;
  format: "technical" | "behavioral" | "mixed";
  level: "junior" | "middle" | "senior";
  questionsCount: number;
  durationMinutes: number;
  includeHints: boolean;
};

type Owner = { anonymousSessionId: string; userId?: string | null };

type SessionInput = {
  anonymousSessionId: string;
  userId: string | null;
  trainingMode: string;
  source: string;
  vacancyTitle: string;
  vacancyRaw: string;
  resumeRaw: string;
  role: string;
  level: string;
  questionCount: number;
  language: string;
  interviewerMode: string;
  interviewerAvatarId: string;
  status: string;
  metadata: Record<string, unknown>;
};

type TurnInput = {
  sessionId: string;
  index: number;
  kind: string;
  question: string;
  answerTranscript: string | null;
  metadata: Record<string, unknown>;
};

function questionPlan(role: string, count: number) {
  const base = [
    `Расскажите о последнем проекте в роли ${role}.`,
    "Как вы принимаете технические решения в условиях ограничений?",
    "Как вы проверяете качество своего решения до выпуска?",
    "Расскажите о сложной ситуации в команде и вашем вкладе в её решение.",
    "Какие профессиональные навыки вы хотите развивать дальше?",
  ];
  return Array.from({ length: count }, (_, index) => ({
    id: `plan-${index + 1}`,
    question: base[index % base.length]!,
  }));
}

export class InterviewCreationService {
  constructor(
    private readonly repository: {
      createSession: (
        input: SessionInput,
      ) => Promise<{ id: string } & SessionInput>;
      createTurn: (input: TurnInput) => Promise<void>;
    },
  ) {}

  async create(params: { owner: Owner; draft: Draft }) {
    const vacancy = params.draft.vacancy.trim();
    const role = vacancy.split("\n")[0]?.slice(0, 160).trim() || "специалист";
    const plan = questionPlan(role, params.draft.questionsCount);
    const session = await this.repository.createSession({
      anonymousSessionId: params.owner.anonymousSessionId,
      userId: params.owner.userId ?? null,
      trainingMode: "candidate",
      source: "text",
      vacancyTitle: role,
      vacancyRaw: vacancy,
      resumeRaw: params.draft.profile.trim(),
      role,
      level: params.draft.level,
      questionCount: params.draft.questionsCount,
      language: "ru",
      interviewerMode: "neutral",
      interviewerAvatarId: "neutral-pro",
      status: "running",
      metadata: {
        plan: { items: plan },
        format: params.draft.format,
        durationMinutes: params.draft.durationMinutes,
        includeHints: params.draft.includeHints,
      },
    });
    const firstQuestion = plan[0]!;
    await this.repository.createTurn({
      sessionId: session.id,
      index: 1,
      kind: "main",
      question: firstQuestion.question,
      answerTranscript: null,
      metadata: {
        planItemId: firstQuestion.id,
        dialogue: [
          {
            role: "interviewer",
            content: firstQuestion.question,
            at: new Date().toISOString(),
          },
        ],
      },
    });

    return {
      session: {
        id: session.id,
        status: "running",
        vacancyTitle: role,
        role,
        totalQuestions: params.draft.questionsCount,
      },
      turns: [],
      currentTurn: {
        id: "",
        sessionId: session.id,
        index: 1,
        kind: "main",
        question: firstQuestion.question,
        answerTranscript: null,
        hintPack: null,
        messages: [
          {
            role: "interviewer",
            content: firstQuestion.question,
            at: new Date().toISOString(),
          },
        ],
      },
    };
  }
}
