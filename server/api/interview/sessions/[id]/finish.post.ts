import { getRouterParam, readBody } from "h3";
import { z } from "zod";

import { InterviewSessionService } from "../../../../application/interview/interviewSessionService";
import { InterviewRepository } from "../../../../infrastructure/db/interviewRepository";
import { apiError } from "../../../../utils/apiError";
import { defineApiRoute } from "../../../../utils/defineApiRoute";
import { requireSession } from "../../../../utils/session";

const requestSchema = z.object({ turnId: z.string().trim().min(1).optional() });

export default defineApiRoute(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw apiError("E_VALIDATION", "Не указан id интервью");

  const parsed = requestSchema.safeParse((await readBody(event)) ?? {});
  if (!parsed.success) throw apiError("E_VALIDATION", "Некорректный запрос");

  const owner = requireSession(event);
  return new InterviewSessionService(new InterviewRepository()).finish({
    owner: { anonymousSessionId: owner.id, userId: owner.userId },
    sessionId: id,
    turnId: parsed.data.turnId,
  });
});
