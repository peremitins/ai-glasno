import { z } from "zod";

import { API_BASE_URL } from "@/shared/api/baseApi";

import {
  interviewWorkspaceSchema,
  interviewHintPackSchema,
  type InterviewWorkspace,
} from "../model/types";

const sourceMessageSchema = z.object({
  role: z.enum(["user", "interviewer"]),
  content: z.string(),
  at: z.string(),
});

const sourceTurnSchema = z.object({
  id: z.string(),
  index: z.number().int().positive(),
  question: z.string(),
  hintPack: interviewHintPackSchema.nullable().optional(),
  answerTranscript: z.string().nullable(),
  messages: z.array(sourceMessageSchema).default([]),
});

const sourceStateSchema = z.object({
  session: z.object({
    id: z.string(),
    status: z.enum(["created", "running", "done"]),
    vacancyTitle: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    totalQuestions: z.number().int().positive(),
    plan: z.array(z.object({ id: z.string(), question: z.string() })).default([]),
  }),
  currentTurn: sourceTurnSchema.nullable(),
  turns: z.array(sourceTurnSchema).default([]),
});

const streamChunkSchema = z.object({
  output_text_delta: z.string().optional(),
  done: z.boolean().optional(),
  state: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

export type StreamInterviewReplyRequest = {
  sessionId: string;
  turnId: string;
  message: string;
};

type StreamInterviewReplyOptions = {
  onDelta: (text: string) => void;
  signal?: AbortSignal;
};

export class InterviewStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterviewStreamError";
  }
}

function createMessageId(turnId: string, index: number, role: string) {
  return `${turnId}-${role}-${index}`;
}

export function normalizeInterviewWorkspace(
  payload: unknown,
): InterviewWorkspace {
  const existingWorkspace = interviewWorkspaceSchema.safeParse(payload);

  if (existingWorkspace.success) {
    return existingWorkspace.data;
  }

  const sourceState = sourceStateSchema.parse(payload);
  const { currentTurn, session } = sourceState;

  return interviewWorkspaceSchema.parse({
    session: {
      id: session.id,
      title: session.vacancyTitle ?? session.role ?? "Интервью",
      status: session.status === "done" ? "completed" : "active",
      completedAt: null,
    },
    totalQuestions: session.totalQuestions,
    plan: session.plan.length
      ? session.plan
      : sourceState.turns.map((turn) => ({ id: turn.id, question: turn.question })),
    currentTurn: currentTurn
      ? {
          id: currentTurn.id,
          index: currentTurn.index,
          question: currentTurn.question,
          hint: currentTurn.hintPack?.structure ?? null,
          hintPack: currentTurn.hintPack ?? null,
          answer: currentTurn.answerTranscript,
          messages: currentTurn.messages.map((message, index) => ({
            id: createMessageId(currentTurn.id, index, message.role),
            role: message.role === "user" ? "candidate" : "interviewer",
            content: message.content,
            createdAt: message.at,
          })),
        }
      : null,
  });
}

function readCsrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};

  const token = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("glasno_csrf="))
    ?.slice("glasno_csrf=".length);

  return token ? { "x-csrf-token": decodeURIComponent(token) } : {};
}

function getStreamUrl(sessionId: string) {
  return new URL(
    `sessions/${encodeURIComponent(sessionId)}/reply-stream`,
    `${API_BASE_URL}/`,
  ).toString();
}

function parseErrorMessage(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "Не удалось получить ответ интервьюера.";
}

function consumeSseEvent(
  rawEvent: string,
  onDelta: (text: string) => void,
): InterviewWorkspace | null {
  const data = rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace(/^data:\s?/, ""))
    .join("\n");

  if (!data || data === "[DONE]") return null;

  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch {
    return null;
  }

  const chunk = streamChunkSchema.safeParse(payload);
  if (!chunk.success) return null;

  if (chunk.data.error) {
    throw new InterviewStreamError(chunk.data.error.message);
  }

  if (chunk.data.output_text_delta) {
    onDelta(chunk.data.output_text_delta);
  }

  if (chunk.data.done && chunk.data.state) {
    return normalizeInterviewWorkspace(chunk.data.state);
  }

  return null;
}

export async function streamInterviewReply(
  request: StreamInterviewReplyRequest,
  options: StreamInterviewReplyOptions,
): Promise<InterviewWorkspace> {
  const response = await fetch(getStreamUrl(request.sessionId), {
    method: "POST",
    credentials: "include",
    signal: options.signal,
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
      ...readCsrfHeader(),
    },
    body: JSON.stringify({ turnId: request.turnId, message: request.message }),
  });

  if (!response.ok || !response.body) {
    let errorPayload: unknown = null;
    try {
      errorPayload = await response.json();
    } catch {
      // Сервер может вернуть пустой ответ при ошибке транспорта.
    }
    throw new InterviewStreamError(parseErrorMessage(errorPayload));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalWorkspace: InterviewWorkspace | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");

    while (boundary !== -1) {
      const workspace = consumeSseEvent(
        buffer.slice(0, boundary),
        options.onDelta,
      );
      if (workspace) finalWorkspace = workspace;
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
  }

  const tail = decoder.decode().trim();
  if (tail) {
    const workspace = consumeSseEvent(tail, options.onDelta);
    if (workspace) finalWorkspace = workspace;
  }

  if (!finalWorkspace) {
    throw new InterviewStreamError(
      "Ответ интервьюера завершился без обновления состояния сессии.",
    );
  }

  return finalWorkspace;
}
