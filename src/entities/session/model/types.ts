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

export const interviewFormatSchema = z.enum(["technical", "behavioral", "mixed"]);
export const interviewLevelSchema = z.enum(["junior", "middle", "senior"]);

export const sessionDraftSchema = z.object({
  vacancy: z.string().trim().min(10, "Опишите вакансию не короче 10 символов"),
  profile: z
    .string()
    .trim()
    .min(20, "Опишите профиль не короче 20 символов"),
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
