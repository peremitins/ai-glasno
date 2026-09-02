import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/shared/api/baseApi";

import type { DashboardOverview } from "@/entities/dashboard/model/types";

const dashboard: DashboardOverview = {
  activeSessions: 2,
  completedSessions: 8,
  nextSession: {
    topic: "Практика TypeScript",
  },
};

export const handlers = [
  http.get(`${API_BASE_URL}/dashboard`, () => HttpResponse.json(dashboard)),
];
