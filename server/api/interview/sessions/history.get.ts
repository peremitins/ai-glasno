import { InterviewRepository } from "../../../infrastructure/db/interviewRepository";
import { defineApiRoute } from "../../../utils/defineApiRoute";
import { requireSession } from "../../../utils/session";

export default defineApiRoute(async (event) => {
  const owner = requireSession(event);
  const repository = new InterviewRepository();
  const sessions = await repository.listForOwner({
    anonymousSessionId: owner.id,
    userId: owner.userId,
  });

  const items = await Promise.all(
    sessions.map(async (session) => {
      const turns = await repository.listTurns(session.id);
      const answeredQuestions = turns.filter((turn) =>
        Boolean(turn.answerTranscript?.trim()),
      ).length;

      return {
        id: session.id,
        title: session.vacancyTitle ?? session.role ?? "Интервью",
        subtitle: session.companyName ?? session.role ?? null,
        status: session.status === "done" ? "completed" : "running",
        trainingMode:
          session.trainingMode === "interviewer" ? "interviewer" : "candidate",
        createdAt: session.createdAt.toISOString(),
        answeredQuestions,
        totalQuestions: session.questionCount,
        report: null,
      };
    }),
  );

  return { items };
});
