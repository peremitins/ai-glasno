import { afterEach, describe, expect, it, vi } from "vitest";

import {
  normalizeInterviewWorkspace,
  streamInterviewReply,
} from "./interviewTransport";

const sourceState = {
  session: {
    id: "session_01",
    status: "running",
    vacancyTitle: "Senior Frontend Developer",
    role: "Frontend-разработчик",
    totalQuestions: 3,
  },
  turns: [],
  currentTurn: {
    id: "turn_01",
    index: 1,
    question: "Как React определяет, когда повторно рендерить компонент?",
    hintPack: {
      structure: "Начните с изменения state или props.",
    },
    answerTranscript: null,
    messages: [
      {
        role: "interviewer",
        content: "Расскажите, как работает повторный рендер.",
        at: "2026-09-06T10:00:00.000Z",
      },
    ],
  },
};

describe("интервью-транспорт", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("приводит состояние эталонного API к модели рабочего пространства", () => {
    expect(normalizeInterviewWorkspace(sourceState)).toMatchObject({
      session: {
        id: "session_01",
        title: "Senior Frontend Developer",
        status: "active",
      },
      totalQuestions: 3,
      currentTurn: {
        id: "turn_01",
        hint: "Начните с изменения state или props.",
        messages: [
          {
            role: "interviewer",
            content: "Расскажите, как работает повторный рендер.",
          },
        ],
      },
    });
  });

  it("передаёт дельты SSE и возвращает финальное состояние сессии", async () => {
    const body = [
      'data: {"output_text_delta":"Хороший "}\n\n',
      'data: {"output_text_delta":"вопрос."}\n\n',
      `data: ${JSON.stringify({ done: true, state: sourceState })}\n\n`,
      "data: [DONE]\n\n",
    ].join("");
    const onDelta = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(body, {
        headers: { "content-type": "text/event-stream" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await streamInterviewReply(
      {
        sessionId: "session_01",
        turnId: "turn_01",
        message: "Мой ответ",
      },
      { onDelta },
    );

    expect(onDelta).toHaveBeenNthCalledWith(1, "Хороший ");
    expect(onDelta).toHaveBeenNthCalledWith(2, "вопрос.");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("sessions/session_01/reply-stream"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ turnId: "turn_01", message: "Мой ответ" }),
      }),
    );
    expect(result.session.status).toBe("active");
    expect(result.currentTurn?.question).toBe(sourceState.currentTurn.question);
  });

  it("передаёт CSRF-token из cookie при отправке реплики", async () => {
    document.cookie = "glasno_csrf=test-token";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          `data: ${JSON.stringify({ done: true, state: sourceState })}\n\n`,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await streamInterviewReply(
      { sessionId: "session_01", turnId: "turn_01", message: "Ответ" },
      { onDelta: vi.fn() },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-csrf-token": "test-token" }),
      }),
    );
  });
});
