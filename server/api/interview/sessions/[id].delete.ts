import { getRouterParam } from "h3";

import { assertOwnedInterviewSession } from "../../../application/interview/sessionOwnership";
import { InterviewRepository } from "../../../infrastructure/db/interviewRepository";
import { apiError } from "../../../utils/apiError";
import { defineApiRoute } from "../../../utils/defineApiRoute";
import { requireSession } from "../../../utils/session";

export default defineApiRoute(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw apiError("E_VALIDATION", "Не указан id интервью");

  const owner = requireSession(event);
  const repository = new InterviewRepository();
  const session = await repository.findSessionById(id);
  const ownedSession = assertOwnedInterviewSession(session, {
    anonymousSessionId: owner.id,
    userId: owner.userId,
  });

  await repository.deleteSession(ownedSession.id);
  return new Response(null, { status: 204 });
});
