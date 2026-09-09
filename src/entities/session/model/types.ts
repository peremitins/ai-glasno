import { z } from "zod";

export const sessionStatusSchema = z.enum(["active", "completed"]);

export type SessionStatus = z.infer<typeof sessionStatusSchema>;

export const interviewSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: sessionStatusSchema,
  completedAt: z.string().nullable(),
});

export const interviewSessionsSchema = z.array(interviewSessionSchema);

export type InterviewSession = z.infer<typeof interviewSessionSchema>;

export const interviewHintPackSchema = z.object({
  bullets: z.array(z.string()).default([]),
  focus: z.string().nullable().optional(),
  structure: z.string(),
  example: z.string().optional(),
});

export type InterviewHintPack = z.infer<typeof interviewHintPackSchema>;

export const interviewMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["candidate", "interviewer"]),
  content: z.string(),
  createdAt: z.string(),
});

export const interviewTurnSchema = z.object({
  id: z.string(),
  index: z.number().int().positive(),
  question: z.string(),
  hint: z.string().nullable(),
  hintPack: interviewHintPackSchema.nullable().default(null),
  answer: z.string().nullable(),
  messages: z.array(interviewMessageSchema),
});

export const interviewWorkspaceSchema = z.object({
  session: interviewSessionSchema,
  currentTurn: interviewTurnSchema.nullable(),
  totalQuestions: z.number().int().positive(),
  plan: z.array(z.object({ id: z.string(), question: z.string() })).default([]),
});

export type InterviewWorkspace = z.infer<typeof interviewWorkspaceSchema>;
export type SaveAnswerRequest = {
  answer: string;
  sessionId: string;
  turnId: string;
};
export type NextQuestionRequest = { sessionId: string; turnId: string };

export const realtimeSdpResponseSchema = z.object({
  sdp: z.string().min(1),
});

export type RealtimeSdpRequest = { sessionId: string; sdp: string };
export type RealtimeSdpResponse = z.infer<typeof realtimeSdpResponseSchema>;
export type AppendDialogueRequest = {
  content: string;
  role: "candidate" | "interviewer";
  sessionId: string;
  turnId: string;
};

export const interviewFormatSchema = z.enum([
  "technical",
  "behavioral",
  "mixed",
]);
export const interviewLevelSchema = z.enum(["junior", "middle", "senior"]);

export const sessionDraftSchema = z.object({
  vacancy: z.string().trim().min(10, "Опишите вакансию не короче 10 символов"),
  profile: z.string().trim().max(15_000),
  format: interviewFormatSchema,
  level: interviewLevelSchema,
  questionsCount: z
    .number()
    .int()
    .min(3, "Выберите от 3 до 20 вопросов")
    .max(20, "Выберите от 5 до 20 вопросов"),
  durationMinutes: z
    .number()
    .int()
    .min(15, "Выберите длительность от 15 до 90 минут")
    .max(90, "Выберите длительность от 15 до 90 минут"),
  includeHints: z.boolean(),
});

export type SessionDraft = z.infer<typeof sessionDraftSchema>;

export type AdvancedSessionCreationRequest = {
  trainingMode: "candidate" | "interviewer";
  source:
    | { type: "hh_url"; url: string }
    | { type: "text"; text: string; title?: string }
    | { type: "profession"; role: string; specialization?: string };
  resumeText?: string;
  level: z.infer<typeof interviewLevelSchema>;
  sessionGoal: "quick" | "standard" | "deep";
  focus?: "hr_screening" | "professional" | "behavioral" | "salary_negotiation";
  interviewerMode: "soft" | "neutral" | "strict";
  customQuestionsText?: string;
  candidatePersona?: string;
  questionSourceMode?: "glasno" | "custom" | "mixed" | "free";
};

export type SessionCreationRequest =
  AdvancedSessionCreationRequest | SessionDraft;

export const uploadedTextSchema = z.object({
  fileName: z.string().nullable(),
  text: z.string(),
});
export type UploadedText = z.infer<typeof uploadedTextSchema>;
