import { useCallback, useEffect, useRef, useState } from "react";

import {
  useAppendDialogueMutation,
  useExchangeRealtimeSdpMutation,
} from "@/entities/session/api/sessionApi";
import type { InterviewWorkspace } from "@/entities/session/model/types";
import { getApiErrorMessage } from "@/shared/api/baseApi";

import {
  startRealtimeVoiceClient,
  type RealtimeVoiceClient,
} from "./realtimeVoiceClient";

type UseRealtimeVoiceOptions = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onError: (message: string) => void;
  onWorkspace: (workspace: InterviewWorkspace) => void;
  sessionId: string;
  turnId: string | null;
};

export function useRealtimeVoice({
  audioRef,
  onError,
  onWorkspace,
  sessionId,
  turnId,
}: UseRealtimeVoiceOptions) {
  const [exchangeSdp] = useExchangeRealtimeSdpMutation();
  const [appendDialogue] = useAppendDialogueMutation();
  const clientRef = useRef<RealtimeVoiceClient | null>(null);
  const turnIdRef = useRef(turnId);
  const onWorkspaceRef = useRef(onWorkspace);
  const persistedMessagesRef = useRef(new Set<string>());
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">(
    "idle",
  );

  useEffect(() => {
    turnIdRef.current = turnId;
    onWorkspaceRef.current = onWorkspace;
  }, [onWorkspace, turnId]);

  const stop = useCallback(() => {
    clientRef.current?.stop();
    clientRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
    setStatus("idle");
  }, [audioRef]);

  const toggle = useCallback(async () => {
    if (clientRef.current) {
      stop();
      return;
    }

    setStatus("connecting");
    try {
      const client = await startRealtimeVoiceClient({
        async exchangeSdp(sdp) {
          const response = await exchangeSdp({ sessionId, sdp }).unwrap();
          return response.sdp;
        },
        onRemoteStream(stream) {
          const audio = audioRef.current;
          if (!audio) return;
          audio.srcObject = stream;
          void audio.play().catch(() => {
            onError(
              "Браузер заблокировал звук. Разрешите воспроизведение и повторите попытку.",
            );
          });
        },
        onEvent(event) {
          if (!event || typeof event !== "object") return;
          const payload = event as Record<string, unknown>;
          const eventType =
            typeof payload.type === "string" ? payload.type : "";
          const transcript =
            typeof payload.transcript === "string"
              ? payload.transcript.trim()
              : "";
          const role = eventType.includes("input_audio_transcription")
            ? "candidate"
            : eventType.includes("output_audio_transcript")
              ? "interviewer"
              : null;
          const messageKey =
            typeof payload.item_id === "string"
              ? payload.item_id
              : typeof payload.response_id === "string"
                ? payload.response_id
                : "";
          if (
            !role ||
            !transcript ||
            !messageKey ||
            persistedMessagesRef.current.has(messageKey)
          ) {
            return;
          }
          const activeTurnId = turnIdRef.current;
          if (!activeTurnId) return;
          persistedMessagesRef.current.add(messageKey);
          void appendDialogue({
            content: transcript,
            role,
            sessionId,
            turnId: activeTurnId,
          })
            .unwrap()
            .then(onWorkspaceRef.current)
            .catch((error) => {
              persistedMessagesRef.current.delete(messageKey);
              onError(getApiErrorMessage(error));
            });
        },
      });
      clientRef.current = client;
      setStatus("connected");
    } catch (error) {
      clientRef.current = null;
      setStatus("idle");
      onError(getApiErrorMessage(error));
    }
  }, [appendDialogue, audioRef, exchangeSdp, onError, sessionId, stop]);

  useEffect(() => stop, [stop]);

  return {
    isActive: status === "connected",
    isBusy: status === "connecting",
    status,
    toggle,
  };
}
