import type { InterviewSession, SessionStatus } from "./types";

export type SessionStatusFilter = SessionStatus | "all";

export function selectSessionsByStatus(
  sessions: InterviewSession[],
  status: SessionStatusFilter,
) {
  if (status === "all") {
    return sessions;
  }

  return sessions.filter((session) => session.status === status);
}
