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
  answer: z.string().nullable(),
  messages: z.array(interviewMessageSchema),
});

export const interviewWorkspaceSchema = z.object({
  session: interviewSessionSchema,
  currentTurn: interviewTurnSchema.nullable(),
  totalQuestions: z.number().int().positive(),
});

export type InterviewWorkspace = z.infer<typeof interviewWorkspaceSchema>;
export type SaveAnswerRequest = { answer: string; turnId: string };
export type NextQuestionRequest = { turnId: string };

export const interviewFormatSchema = z.enum([
  "technical",
  "behavioral",
  "mixed",
]);
export const interviewLevelSchema = z.enum(["junior", "middle", "senior"]);

export const sessionDraftSchema = z.object({
  vacancy: z.string().trim().min(10, "Опишите вакансию не короче 10 символов"),
  profile: z.string().trim().min(20, "Опишите профиль не короче 20 символов"),
  format: interviewFormatSchema,
  level: interviewLevelSchema,
  questionsCount: z
    .number()
    .int()
    .min(5, "Выберите от 5 до 20 вопросов")
    .max(20, "Выберите от 5 до 20 вопросов"),
  durationMinutes: z
    .number()
    .int()
    .min(15, "Выберите длительность от 15 до 90 минут")
    .max(90, "Выберите длительность от 15 до 90 минут"),
  includeHints: z.boolean(),
});

export type SessionDraft = z.infer<typeof sessionDraftSchema>;
