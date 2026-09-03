import type { DashboardOverview } from "@/entities/dashboard/model/types";

const defaultDashboard: DashboardOverview = {
  activeSessions: 2,
  completedSessions: 8,
  nextSession: {
    topic: "Практика TypeScript",
  },
  recentSessions: [],
};

export function createDashboardFixture(
  overrides: Partial<DashboardOverview> = {},
): DashboardOverview {
  return {
    ...defaultDashboard,
    ...overrides,
    nextSession: {
      ...defaultDashboard.nextSession,
      ...overrides.nextSession,
    },
    recentSessions: overrides.recentSessions ?? defaultDashboard.recentSessions,
  };
}
