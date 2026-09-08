import { describe, expect, it } from "vitest";

import { getCompletedRealtimeTranscript } from "./realtimeTranscript";

describe("getCompletedRealtimeTranscript", () => {
  it("извлекает завершённую реплику кандидата", () => {
    expect(
      getCompletedRealtimeTranscript({
        item_id: "item-candidate-1",
        transcript: "  Расскажу о проекте. ",
        type: "conversation.item.input_audio_transcription.completed",
      }),
    ).toEqual({
      id: "item-candidate-1",
      role: "candidate",
      text: "Расскажу о проекте.",
    });
  });

  it("извлекает завершённую реплику интервьюера", () => {
    expect(
      getCompletedRealtimeTranscript({
        item_id: "item-interviewer-1",
        transcript: "Уточните ваш вклад.",
        type: "response.output_audio_transcript.done",
      }),
    ).toEqual({
      id: "item-interviewer-1",
      role: "interviewer",
      text: "Уточните ваш вклад.",
    });
  });

  it("игнорирует промежуточные и неполные события", () => {
    expect(
      getCompletedRealtimeTranscript({
        delta: "неполная реплика",
        item_id: "item-1",
        type: "response.output_audio_transcript.delta",
      }),
    ).toBeNull();
    expect(
      getCompletedRealtimeTranscript({
        transcript: "Реплика без идентификатора",
        type: "response.output_audio_transcript.done",
      }),
    ).toBeNull();
  });
});
