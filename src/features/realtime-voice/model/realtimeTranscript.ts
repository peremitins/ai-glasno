type RealtimeTranscript = {
  id: string;
  role: "candidate" | "interviewer";
  text: string;
};

const transcriptEventRoles = {
  "conversation.item.input_audio_transcription.completed": "candidate",
  "response.output_audio_transcript.done": "interviewer",
} as const;

export function getCompletedRealtimeTranscript(
  event: unknown,
): RealtimeTranscript | null {
  if (!event || typeof event !== "object") return null;

  const payload = event as Record<string, unknown>;
  const role =
    typeof payload.type === "string"
      ? transcriptEventRoles[
          payload.type as keyof typeof transcriptEventRoles
        ]
      : undefined;
  const id = typeof payload.item_id === "string" ? payload.item_id : "";
  const text = typeof payload.transcript === "string" ? payload.transcript.trim() : "";

  return role && id && text ? { id, role, text } : null;
}
