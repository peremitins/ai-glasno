import { getRouterParam, readBody } from "h3";
import { z } from "zod";

import { buildRealtimeSessionPayload } from "../../../../application/interview/realtimeSession";
import { assertOwnedInterviewSession } from "../../../../application/interview/sessionOwnership";
import { InterviewRepository } from "../../../../infrastructure/db/interviewRepository";
import { getRuntimeConfig } from "../../../../config/runtimeConfig";
import { exchangeRealtimeSdpWithRelay } from "../../../../infrastructure/llm/aiRelay";
import { apiError } from "../../../../utils/apiError";
import { defineApiRoute } from "../../../../utils/defineApiRoute";
import { requireSession } from "../../../../utils/session";

const requestSchema = z.object({ sdp: z.string().trim().min(1) });
const OPENAI_REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

export default defineApiRoute(async (event) => {
  const sessionId = getRouterParam(event, "id");
  if (!sessionId) throw apiError("E_VALIDATION", "Не указан id интервью");

  const parsed = requestSchema.safeParse((await readBody(event)) ?? {});
  if (!parsed.success) {
    throw apiError(
      "E_VALIDATION",
      "Не удалось сформировать голосовое соединение",
    );
  }

  const owner = requireSession(event);
  const repository = new InterviewRepository();
  const interview = assertOwnedInterviewSession(
    await repository.findSessionById(sessionId),
    { anonymousSessionId: owner.id, userId: owner.userId },
  );
  if (interview.status !== "running") {
    throw apiError("E_CONFLICT", "Интервью уже завершено");
  }

  const currentTurn = (await repository.listTurns(interview.id)).find(
    (turn) => !turn.answerTranscript,
  );
  if (!currentTurn) {
    throw apiError("E_CONFLICT", "Нет активного вопроса для голосового режима");
  }

  const runtimeConfig = getRuntimeConfig();
  const realtimeSession = buildRealtimeSessionPayload({
    model: runtimeConfig.server.openAi.realtimeModel,
    question: currentTurn.question,
    role: interview.role,
    sessionId: interview.id,
  }).session;

  if (runtimeConfig.server.aiRelay.enabled) {
    const sdp = await exchangeRealtimeSdpWithRelay({
      config: runtimeConfig.server.aiRelay,
      sdp: parsed.data.sdp,
      session: realtimeSession,
    });
    return { sdp };
  }

  const body = new FormData();
  body.set("sdp", parsed.data.sdp);
  body.set("session", JSON.stringify(realtimeSession));

  let response: Response;
  try {
    response = await fetch(OPENAI_REALTIME_CALLS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${runtimeConfig.server.openAi.apiKey}`,
      },
      body,
    });
  } catch {
    throw apiError("E_UPSTREAM", "Не удалось подключить голосовой режим");
  }

  const answerSdp = await response.text();
  if (!response.ok || !answerSdp.trim()) {
    throw apiError("E_UPSTREAM", "Провайдер голосового режима недоступен");
  }

  return { sdp: answerSdp };
});
