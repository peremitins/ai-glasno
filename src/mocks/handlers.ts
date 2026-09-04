import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/shared/api/baseApi";

import type { DashboardOverview } from "@/entities/dashboard/model/types";
import type { SessionDraft } from "@/entities/session/model/types";
import type { AuthUser } from "@/entities/user/model/types";

const dashboard: DashboardOverview = {
  activeSessions: 2,
  completedSessions: 8,
  nextSession: {
    topic: "Практика TypeScript",
  },
  recentSessions: [
    {
      id: "session_01",
      title: "Практика TypeScript",
      status: "active",
      completedAt: null,
    },
    {
      id: "session_02",
      title: "Frontend-разработчик",
      status: "completed",
      completedAt: "2026-09-01T10:00:00.000Z",
    },
  ],
};

const initialSessions = [...dashboard.recentSessions];
let sessions = [...initialSessions];

const initialUser: AuthUser = {
  id: "user_01",
  email: "nikolay@example.com",
  displayName: "Николай",
};

let user = initialUser;

export function resetMockData() {
  user = initialUser;
  sessions = [...initialSessions];
}

export const handlers = [
  http.get(`${API_BASE_URL}/dashboard`, () => HttpResponse.json(dashboard)),
  http.get(`${API_BASE_URL}/sessions`, () => HttpResponse.json(sessions)),
  http.post(`${API_BASE_URL}/sessions`, async ({ request }) => {
    const body = (await request.json()) as Partial<SessionDraft>;

    if (!body.vacancy?.trim()) {
      return HttpResponse.json(
        { code: "invalid_session", message: "Укажите вакансию." },
        { status: 400 },
      );
    }

    const session = {
      id: "session_03",
      title: body.vacancy.trim(),
      status: "active" as const,
      completedAt: null,
    };
    sessions = [session, ...sessions];

    return HttpResponse.json(session, { status: 201 });
  }),
  http.post(`${API_BASE_URL}/auth/email/start`, () =>
    HttpResponse.json({ ok: true, devCode: "123456" }),
  ),
  http.post(`${API_BASE_URL}/auth/email/verify`, async ({ request }) => {
    const body = (await request.json()) as { code?: string; email?: string };

    if (body.code !== "123456") {
      return HttpResponse.json(
        {
          code: "invalid_code",
          message: "Код не подошёл. Попробуйте ещё раз.",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      user: {
        ...user,
        email: body.email ?? user.email,
      },
    });
  }),
  http.get(`${API_BASE_URL}/profile`, () => HttpResponse.json(user)),
  http.patch(`${API_BASE_URL}/profile`, async ({ request }) => {
    const body = (await request.json()) as { displayName?: string };

    if (!body.displayName?.trim()) {
      return HttpResponse.json(
        { code: "invalid_profile", message: "Укажите имя для профиля." },
        { status: 400 },
      );
    }

    user = {
      ...user,
      displayName: body.displayName.trim(),
    };

    return HttpResponse.json({ user });
  }),
];
