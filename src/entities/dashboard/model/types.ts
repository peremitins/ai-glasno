export type DashboardOverview = {
  activeSessions: number;
  completedSessions: number;
  nextSession: {
    topic: string;
  };
};
