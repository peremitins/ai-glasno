import { readBody } from "h3";

import { InterviewCreationService } from "../../application/interview/interviewCreationService";
import { normalizeCreationRequest } from "../../application/interview/creationRequest";
import { InterviewRepository } from "../../infrastructure/db/interviewRepository";
import { apiError } from "../../utils/apiError";
import { defineApiRoute } from "../../utils/defineApiRoute";
import { requireSession } from "../../utils/session";

export default defineApiRoute(async (event) => {
  let draft;
  try {
    draft = normalizeCreationRequest(await readBody(event));
  } catch {
    throw apiError("E_VALIDATION", "Проверьте параметры новой сессии");
  }

  const owner = requireSession(event);
  const state = await new InterviewCreationService(
    new InterviewRepository(),
  ).create({
    owner: { anonymousSessionId: owner.id, userId: owner.userId },
    draft,
  });

  return {
    id: state.session.id,
    title: state.session.vacancyTitle ?? state.session.role ?? "Интервью",
    status: "active",
    completedAt: null,
  };
});
