import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/shared/api/baseApi";

import type { DashboardOverview } from "@/entities/dashboard/model/types";
import type {
  InterviewWorkspace,
  SessionDraft,
} from "@/entities/session/model/types";
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

const initialWorkspace: InterviewWorkspace = {
  session: initialSessions[0],
  totalQuestions: 3,
  currentTurn: {
    id: "turn_01",
    index: 1,
    question: "Объясните разницу между type и interface в TypeScript.",
    hint: "Сравните расширение, декларативное слияние и описание объектов.",
    answer: null,
    messages: [
      {
        id: "message_01",
        role: "interviewer",
        content: "Начнём с TypeScript. Ответьте развёрнуто и приведите пример.",
        createdAt: "2026-09-06T09:00:00.000Z",
      },
    ],
  },
};

let workspace: InterviewWorkspace = structuredClone(initialWorkspace);

function createWorkspace(
  session: InterviewWorkspace["session"],
): InterviewWorkspace {
  return {
    ...structuredClone(initialWorkspace),
    session,
  };
}

const initialUser: AuthUser = {
  id: "user_01",
  email: "nikolay@example.com",
  displayName: "Николай",
};

let user = initialUser;

export function resetMockData() {
  user = initialUser;
  sessions = [...initialSessions];
  workspace = structuredClone(initialWorkspace);
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
    workspace = createWorkspace(session);

    return HttpResponse.json(session, { status: 201 });
  }),
  http.get(`${API_BASE_URL}/sessions/:sessionId`, ({ params }) => {
    if (params.sessionId !== workspace.session.id) {
      return HttpResponse.json(
        { code: "session_not_found", message: "Сессия не найдена." },
        { status: 404 },
      );
    }

    return HttpResponse.json(workspace);
  }),
  http.post(
    `${API_BASE_URL}/sessions/turns/:turnId/answer`,
    async ({ params, request }) => {
      const currentTurn = workspace.currentTurn;

      if (!currentTurn || params.turnId !== currentTurn.id) {
        return HttpResponse.json(
          { code: "turn_not_found", message: "Вопрос не найден." },
          { status: 404 },
        );
      }

      const body = (await request.json()) as { answer?: string };
      const answer = body.answer?.trim();

      if (!answer) {
        return HttpResponse.json(
          { code: "invalid_answer", message: "Введите ответ перед отправкой." },
          { status: 400 },
        );
      }

      workspace = {
        ...workspace,
        currentTurn: {
          ...currentTurn,
          answer,
          messages: [
            ...currentTurn.messages,
            {
              id: `message_${currentTurn.messages.length + 1}`,
              role: "candidate",
              content: answer,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      };

      return HttpResponse.json(workspace);
    },
  ),
  http.post(`${API_BASE_URL}/sessions/turns/:turnId/next`, ({ params }) => {
    if (params.turnId !== workspace.currentTurn?.id) {
      return HttpResponse.json(
        { code: "turn_not_found", message: "Вопрос не найден." },
        { status: 404 },
      );
    }

    workspace = {
      ...workspace,
      currentTurn: {
        id: "turn_02",
        index: 2,
        question: "Когда стоит использовать unknown вместо any?",
        hint: "Подумайте о безопасном сужении типа перед использованием значения.",
        answer: null,
        messages: [
          {
            id: "message_03",
            role: "interviewer",
            content: "Перейдём к следующему вопросу.",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    };

    return HttpResponse.json(workspace);
  }),
  http.post(`${API_BASE_URL}/sessions/:sessionId/complete`, ({ params }) => {
    if (params.sessionId !== workspace.session.id) {
      return HttpResponse.json(
        { code: "session_not_found", message: "Сессия не найдена." },
        { status: 404 },
      );
    }

    workspace = {
      ...workspace,
      session: {
        ...workspace.session,
        status: "completed",
        completedAt: new Date().toISOString(),
      },
      currentTurn: null,
    };
    sessions = sessions.map((session) =>
      session.id === workspace.session.id ? workspace.session : session,
    );

    return HttpResponse.json(workspace);
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
