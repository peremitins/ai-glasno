import { getRouterParam, readBody } from "h3";
import { z } from "zod";

import { InterviewDialogueService } from "../../../../application/interview/interviewDialogueService";
import { toInterviewState } from "../../../../application/interview/interviewState";
import { assertOwnedInterviewSession } from "../../../../application/interview/sessionOwnership";
import { InterviewRepository } from "../../../../infrastructure/db/interviewRepository";
import { apiError } from "../../../../utils/apiError";
import { defineApiRoute } from "../../../../utils/defineApiRoute";
import { requireSession } from "../../../../utils/session";

const requestSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  role: z.enum(["candidate", "interviewer"]),
  turnId: z.string().trim().min(1),
});

export default defineApiRoute(async (event) => {
  const sessionId = getRouterParam(event, "id");
  if (!sessionId) throw apiError("E_VALIDATION", "Не указан id интервью");
  const parsed = requestSchema.safeParse((await readBody(event)) ?? {});
  if (!parsed.success) throw apiError("E_VALIDATION", "Некорректная реплика");

  const owner = requireSession(event);
  const repository = new InterviewRepository();
  await new InterviewDialogueService(repository).append({
    ...parsed.data,
    owner: { anonymousSessionId: owner.id, userId: owner.userId },
    sessionId,
  });
  const session = assertOwnedInterviewSession(
    await repository.findSessionById(sessionId),
    { anonymousSessionId: owner.id, userId: owner.userId },
  );
  return toInterviewState(session, await repository.listTurns(session.id));
});
