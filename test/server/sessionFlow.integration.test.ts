import { createApp } from "h3";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { server } from "../../src/test/server";

const repository = vi.hoisted(() => {
  let session: Record<string, unknown> | null = null;
  const turns: Array<Record<string, unknown>> = [];

  return {
    reset() {
      session = null;
      turns.length = 0;
    },
    createSession: vi.fn(async (input: Record<string, unknown>) => {
      session = { id: "session-1", ...input };
      return session;
    }),
    createTurn: vi.fn(async (input: Record<string, unknown>) => {
      turns.push({ id: `turn-${turns.length + 1}`, ...input });
    }),
    findSessionById: vi.fn(async (id: string) =>
      session?.id === id ? session : null,
    ),
    listTurns: vi.fn(async () => turns),
  };
});

vi.mock("../../server/infrastructure/db/interviewRepository", () => ({
  InterviewRepository: class {
    createSession = repository.createSession;
    createTurn = repository.createTurn;
    findSessionById = repository.findSessionById;
    listTurns = repository.listTurns;
  },
}));

import getSession from "../../server/api/interview/sessions/[id].get";
import createSession from "../../server/api/interview/sessions.post";
import sessionMiddleware from "../../server/middleware/10.session";

const creationRequest = {
  vacancy: "Frontend-разработчик React и TypeScript",
  profile: "Разрабатываю интерфейсы и проектирую клиентские приложения.",
  format: "technical",
  level: "middle",
  questionsCount: 5,
  durationMinutes: 30,
  includeHints: true,
};

describe("сценарий создания и загрузки интервью", () => {
  beforeAll(() => server.close());

  beforeEach(() => {
    repository.reset();
    vi.clearAllMocks();
  });

  afterAll(() => server.listen({ onUnhandledRequest: "error" }));

  it("загружает только что созданную сессию с той же анонимной cookie", async () => {
    const app = createApp();
    app.use(sessionMiddleware);
    app.post("/api/interview/sessions", createSession);
    app.get("/api/interview/sessions/:id", getSession);

    const created = await app.fetch(
      new Request("http://localhost/api/interview/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(creationRequest),
      }),
    );

    expect(created.status).toBe(200);
    const cookie = created.headers.get("set-cookie");
    expect(cookie).toContain("glasno_sid=");
    const requestCookie = cookie?.split(";", 1)[0] ?? "";
    const { id } = (await created.json()) as { id: string };

    const loaded = await app.fetch(
      new Request(`http://localhost/api/interview/sessions/${id}`, {
        headers: { cookie: requestCookie },
      }),
    );

    expect(loaded.status).toBe(200);
    expect(await loaded.json()).toMatchObject({
      session: { id },
    });
  });
});
