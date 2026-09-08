import { describe, expect, it } from "vitest";

import { buildRealtimeSessionPayload } from "./realtimeSession";

describe("конфигурация realtime-интервью", () => {
  it("формирует русский контекст только из подтверждённого состояния интервью", () => {
    const payload = buildRealtimeSessionPayload({
      model: "gpt-realtime-mini",
      question: "Расскажите о последнем проекте.",
      role: "frontend developer",
      sessionId: "session-01",
    });

    expect(payload.session).toMatchObject({
      type: "realtime",
      model: "gpt-realtime-mini",
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe" },
          turn_detection: { create_response: true },
        },
        output: { voice: "marin" },
      },
    });
    expect(payload.session.instructions).toContain(
      "Расскажите о последнем проекте.",
    );
    expect(payload.session.instructions).toContain("frontend developer");
    expect(payload.session.instructions).toContain("session-01");
  });
});
