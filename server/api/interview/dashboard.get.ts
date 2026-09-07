import { toDashboardOverview } from "../../application/dashboard/dashboardSummary";
import { InterviewRepository } from "../../infrastructure/db/interviewRepository";
import { defineApiRoute } from "../../utils/defineApiRoute";
import { requireSession } from "../../utils/session";

export default defineApiRoute(async (event) => {
  const owner = requireSession(event);
  const sessions = await new InterviewRepository().listForOwner({
    anonymousSessionId: owner.id,
    userId: owner.userId,
  });
  return toDashboardOverview(sessions);
});
