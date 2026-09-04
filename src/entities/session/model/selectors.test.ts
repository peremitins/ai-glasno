import { describe, expect, it } from "vitest";

import type { InterviewSession } from "./types";
import { selectSessionsByStatus } from "./selectors";

const sessions: InterviewSession[] = [
  {
    id: "session_01",
    title: "Frontend-разработчик",
    status: "completed",
    completedAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "session_02",
    title: "TypeScript",
    status: "active",
    completedAt: null,
  },
];

describe("selectSessionsByStatus", () => {
  it("возвращает все сессии для фильтра all", () => {
    expect(selectSessionsByStatus(sessions, "all")).toEqual(sessions);
  });

  it("оставляет только сессии выбранного статуса", () => {
    expect(selectSessionsByStatus(sessions, "completed")).toEqual([
      sessions[0],
    ]);
  });

  it("оставляет активные сессии для фильтра active", () => {
    expect(selectSessionsByStatus(sessions, "active")).toEqual([sessions[1]]);
  });
});
