import { z } from "zod";

const baseDraftSchema = z.object({
  vacancy: z.string().trim().min(10).max(30_000),
  profile: z.string().trim().min(20).max(15_000),
  format: z.enum(["technical", "behavioral", "mixed"]),
  level: z.enum(["junior", "middle", "senior"]),
  questionsCount: z.number().int().min(3).max(20),
  durationMinutes: z.number().int().min(15).max(90),
  includeHints: z.boolean(),
});

const advancedRequestSchema = z.object({
  trainingMode: z.enum(["candidate", "interviewer"]).default("candidate"),
  source: z.union([
    z.object({ type: z.literal("hh_url"), url: z.string().url() }),
    z.object({
      type: z.literal("text"),
      text: z.string().trim().min(10),
      title: z.string().trim().optional(),
    }),
    z.object({
      type: z.literal("profession"),
      role: z.string().trim().min(2),
      specialization: z.string().trim().optional(),
    }),
  ]),
  resumeText: z.string().trim().max(15_000).optional(),
  level: z.enum(["junior", "middle", "senior"]).default("middle"),
  sessionGoal: z.enum(["quick", "standard", "deep"]).default("standard"),
  focus: z
    .enum(["hr_screening", "professional", "behavioral", "salary_negotiation"])
    .optional(),
  interviewerMode: z.enum(["soft", "neutral", "strict"]).default("neutral"),
  customQuestionsText: z.string().trim().max(10_000).optional(),
  candidatePersona: z.string().trim().max(1_000).optional(),
  questionSourceMode: z
    .enum(["glasno", "custom", "mixed", "free"])
    .default("mixed"),
});

export type CreationDraft = z.infer<typeof baseDraftSchema> & {
  trainingMode?: "candidate" | "interviewer";
  sourceType?: "hh_url" | "text" | "profession";
  sessionGoal?: "quick" | "standard" | "deep";
  interviewerMode?: "soft" | "neutral" | "strict";
  focus?: "hr_screening" | "professional" | "behavioral" | "salary_negotiation";
  customQuestionsText?: string;
  candidatePersona?: string;
  questionSourceMode?: "glasno" | "custom" | "mixed" | "free";
};
export type AdvancedCreationRequest = z.infer<typeof advancedRequestSchema>;

function getGoalSettings(goal: AdvancedCreationRequest["sessionGoal"]) {
  if (goal === "quick") return { durationMinutes: 15, questionsCount: 3 };
  if (goal === "deep") return { durationMinutes: 60, questionsCount: 10 };
  return { durationMinutes: 45, questionsCount: 6 };
}

function getVacancy(source: AdvancedCreationRequest["source"]) {
  if (source.type === "text") return source.text;
  if (source.type === "profession")
    return [source.role, source.specialization].filter(Boolean).join(" · ");
  return source.url;
}

export function normalizeCreationRequest(input: unknown): CreationDraft {
  const base = baseDraftSchema.safeParse(input);
  if (base.success) return base.data;

  const advanced = advancedRequestSchema.parse(input);
  const goal = getGoalSettings(advanced.sessionGoal);
  const vacancy = getVacancy(advanced.source);

  return {
    vacancy,
    profile:
      advanced.resumeText ||
      "Кандидат начинает репетицию и уточнит свой опыт во время интервью.",
    format:
      advanced.focus === "behavioral"
        ? "behavioral"
        : advanced.focus === "professional"
          ? "technical"
          : "mixed",
    level: advanced.level,
    questionsCount: goal.questionsCount,
    durationMinutes: goal.durationMinutes,
    includeHints: true,
    trainingMode: advanced.trainingMode,
    sourceType: advanced.source.type,
    sessionGoal: advanced.sessionGoal,
    interviewerMode: advanced.interviewerMode,
    focus: advanced.focus,
    customQuestionsText: advanced.customQuestionsText,
    candidatePersona: advanced.candidatePersona,
    questionSourceMode: advanced.questionSourceMode,
  };
}
