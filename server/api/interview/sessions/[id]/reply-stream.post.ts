import { getRouterParam, readBody, setHeader } from "h3";
import { z } from "zod";

import { InterviewReplyService } from "../../../../application/interview/interviewReplyService";
import { toInterviewState } from "../../../../application/interview/interviewState";
import { assertOwnedInterviewSession } from "../../../../application/interview/sessionOwnership";
import { InterviewRepository } from "../../../../infrastructure/db/interviewRepository";
import { InterviewResponder } from "../../../../infrastructure/llm/interviewResponder";
import { apiError, ApiError } from "../../../../utils/apiError";
import { requireSession } from "../../../../utils/session";

const requestSchema = z.object({
  turnId: z.string().trim().min(1),
  message: z.string().trim().min(1).max(20_000),
});

function writeEvent(
  response: { write: (chunk: string) => void },
  payload: Record<string, unknown>,
) {
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export default defineEventHandler(async (event) => {
  setHeader(event, "content-type", "text/event-stream; charset=utf-8");
  setHeader(event, "cache-control", "no-cache, no-transform");
  setHeader(event, "connection", "keep-alive");
  setHeader(event, "x-accel-buffering", "no");

  const response = event.node.res;
  response.flushHeaders?.();
  response.socket?.setNoDelay?.(true);
  response.write(": open\n\n");

  try {
    const id = getRouterParam(event, "id");
    if (!id) throw apiError("E_VALIDATION", "Не указан id интервью");

    const parsed = requestSchema.safeParse(await readBody(event));
    if (!parsed.success) {
      throw apiError("E_VALIDATION", "Некорректные данные сообщения");
    }

    const owner = requireSession(event);
    const repository = new InterviewRepository();
    const replyService = new InterviewReplyService(repository);
    const responder = new InterviewResponder();
    for await (const chunk of replyService.stream({
      owner: { anonymousSessionId: owner.id, userId: owner.userId },
      sessionId: id,
      turnId: parsed.data.turnId,
      message: parsed.data.message,
      reply: (input) => responder.stream(input),
    })) {
      writeEvent(response, { output_text_delta: chunk });
    }

    const session = assertOwnedInterviewSession(
      await repository.findSessionById(id),
      { anonymousSessionId: owner.id, userId: owner.userId },
    );
    writeEvent(response, {
      done: true,
      state: toInterviewState(session, await repository.listTurns(id)),
    });
  } catch (error) {
    const apiErrorPayload =
      error instanceof ApiError
        ? error.data
        : { code: "E_UNKNOWN", message: "Внутренняя ошибка сервера" };
    writeEvent(response, { error: apiErrorPayload });
  } finally {
    response.write("data: [DONE]\n\n");
    response.end();
  }
});
