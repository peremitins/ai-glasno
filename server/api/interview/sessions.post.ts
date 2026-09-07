import { readBody } from "h3";
import { z } from "zod";

import { InterviewCreationService } from "../../application/interview/interviewCreationService";
import { InterviewRepository } from "../../infrastructure/db/interviewRepository";
import { apiError } from "../../utils/apiError";
import { defineApiRoute } from "../../utils/defineApiRoute";
import { requireSession } from "../../utils/session";

const draftSchema = z.object({
  vacancy: z.string().trim().min(10).max(30_000),
  profile: z.string().trim().min(20).max(15_000),
  format: z.enum(["technical", "behavioral", "mixed"]),
  level: z.enum(["junior", "middle", "senior"]),
  questionsCount: z.number().int().min(5).max(20),
  durationMinutes: z.number().int().min(15).max(90),
  includeHints: z.boolean(),
});

export default defineApiRoute(async (event) => {
  const parsed = draftSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw apiError("E_VALIDATION", "Проверьте параметры новой сессии");
  }

  const owner = requireSession(event);
  const state = await new InterviewCreationService(
    new InterviewRepository(),
  ).create({
    owner: { anonymousSessionId: owner.id, userId: owner.userId },
    draft: parsed.data,
  });

  return {
    id: state.session.id,
    title: state.session.vacancyTitle ?? state.session.role ?? "Интервью",
    status: "active",
    completedAt: null,
  };
});
