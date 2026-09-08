import { apiError } from "../../utils/apiError";

export type OwnedInterviewSession = {
  anonymousSessionId: string;
  userId: string | null;
};

export function assertOwnedInterviewSession<T extends OwnedInterviewSession>(
  session: T | null | undefined,
  owner: { anonymousSessionId: string; userId?: string | null },
): T {
  if (!session) {
    throw apiError("E_NOT_FOUND", "Интервью не найдено");
  }

  const ownedByUser = Boolean(owner.userId && session.userId === owner.userId);
  const ownedByAnonymousSession =
    !owner.userId &&
    !session.userId &&
    session.anonymousSessionId === owner.anonymousSessionId;

  if (!ownedByUser && !ownedByAnonymousSession) {
    throw apiError("E_FORBIDDEN", "Нет доступа к этому интервью");
  }

  return session;
}
