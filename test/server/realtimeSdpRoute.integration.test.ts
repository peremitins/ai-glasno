import { createApp, defineEventHandler } from "h3";
import { afterEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findSessionById: vi.fn(),
  listTurns: vi.fn(),
}));

vi.mock("../../server/config/runtimeConfig", () => ({
  getRuntimeConfig: () => ({
    server: {
      aiRelay: { authSecret: "", clientId: "", enabled: false, url: "" },
      openAi: { apiKey: "server-only-key", realtimeModel: "gpt-realtime-mini" },
    },
  }),
}));

vi.mock("../../server/infrastructure/db/interviewRepository", () => ({
  InterviewRepository: class {
    findSessionById = repository.findSessionById;
    listTurns = repository.listTurns;
  },
}));

import realtimeSdpRoute from "../../server/api/interview/sessions/[id]/realtime-sdp.post";

describe("защищённый SDP-обмен", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("отправляет провайдеру SDP только владельца активной сессии", async () => {
    repository.findSessionById.mockResolvedValue({
      id: "session-01",
      anonymousSessionId: "anonymous-owner",
      userId: null,
      role: "frontend developer",
      status: "running",
    });
    repository.listTurns.mockResolvedValue([
      {
        answerTranscript: null,
        question: "Расскажите о последнем проекте.",
      },
    ]);
    const providerFetch = vi.fn(async () => new Response("answer-sdp"));
    vi.stubGlobal("fetch", providerFetch);

    const app = createApp();
    app.use(
      defineEventHandler((event) => {
        event.context.session = { id: "anonymous-owner", isAnonymous: true };
      }),
    );
    app.post("/api/interview/sessions/:id/realtime-sdp", realtimeSdpRoute);

    const response = await app.fetch(
      new Request(
        "http://localhost/api/interview/sessions/session-01/realtime-sdp",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sdp: "browser-offer" }),
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sdp: "answer-sdp" });
    expect(providerFetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/realtime/calls",
      expect.objectContaining({
        headers: { Authorization: "Bearer server-only-key" },
        method: "POST",
      }),
    );
  });

  it("не создаёт соединение для чужой анонимной сессии", async () => {
    repository.findSessionById.mockResolvedValue({
      id: "session-01",
      anonymousSessionId: "another-owner",
      userId: null,
      role: "frontend developer",
      status: "running",
    });
    const providerFetch = vi.fn();
    vi.stubGlobal("fetch", providerFetch);

    const app = createApp();
    app.use(
      defineEventHandler((event) => {
        event.context.session = { id: "anonymous-owner", isAnonymous: true };
      }),
    );
    app.post("/api/interview/sessions/:id/realtime-sdp", realtimeSdpRoute);

    const response = await app.fetch(
      new Request(
        "http://localhost/api/interview/sessions/session-01/realtime-sdp",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sdp: "browser-offer" }),
        },
      ),
    );

    expect(response.status).toBe(403);
    expect(providerFetch).not.toHaveBeenCalled();
  });
});
