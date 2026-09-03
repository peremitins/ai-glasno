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
