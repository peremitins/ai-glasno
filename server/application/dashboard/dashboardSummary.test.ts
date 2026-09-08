import { describe, expect, it } from "vitest";

import { toDashboardOverview } from "./dashboardSummary";

describe("toDashboardOverview", () => {
  it("считает активные и завершённые сессии владельца", () => {
    expect(
      toDashboardOverview([
        { id: "one", status: "running", vacancyTitle: "React" },
        { id: "two", status: "done", vacancyTitle: "Vue" },
      ]),
    ).toEqual({
      activeSessions: 1,
      completedSessions: 1,
      nextSession: { topic: "React" },
      recentSessions: [
        { id: "one", title: "React", status: "active", completedAt: null },
        { id: "two", title: "Vue", status: "completed", completedAt: null },
      ],
    });
  });
});
