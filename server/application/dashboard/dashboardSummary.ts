type DashboardSession = {
  id: string;
  status: string;
  vacancyTitle: string | null;
  role?: string | null;
  createdAt?: Date | string | null;
};

export function toDashboardOverview(sessions: DashboardSession[]) {
  const recentSessions = sessions.slice(0, 8).map((session) => ({
    id: session.id,
    title: session.vacancyTitle ?? session.role ?? "Интервью",
    status:
      session.status === "done" ? ("completed" as const) : ("active" as const),
    completedAt: null,
  }));
  const activeSessions = sessions.filter(
    (session) => session.status === "running",
  ).length;
  const completedSessions = sessions.filter(
    (session) => session.status === "done",
  ).length;

  return {
    activeSessions,
    completedSessions,
    nextSession: {
      topic:
        recentSessions.find((session) => session.status === "active")?.title ??
        "Новая репетиция",
    },
    recentSessions,
  };
}
