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
import { getCompletedRealtimeTranscript } from "./realtimeTranscript";

type UseRealtimeVoiceOptions = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onError: (message: string) => void;
  onWorkspace: (workspace: InterviewWorkspace) => void;
  question: string | null;
  sessionId: string;
  turnId: string | null;
};

export function useRealtimeVoice({
  audioRef,
  onError,
  onWorkspace,
  question,
  sessionId,
  turnId,
}: UseRealtimeVoiceOptions) {
  const [exchangeSdp] = useExchangeRealtimeSdpMutation();
  const [appendDialogue] = useAppendDialogueMutation();
  const clientRef = useRef<RealtimeVoiceClient | null>(null);
  const turnIdRef = useRef(turnId);
  const onWorkspaceRef = useRef(onWorkspace);
  const persistedMessagesRef = useRef(new Set<string>());
  const persistQueueRef = useRef(Promise.resolve());
  const announcedTurnRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">(
    "idle",
  );

  useEffect(() => {
    turnIdRef.current = turnId;
    onWorkspaceRef.current = onWorkspace;
  }, [onWorkspace, turnId]);

  useEffect(() => {
    const client = clientRef.current;
    if (status !== "connected" || !client || !turnId || !question) return;
    if (announcedTurnRef.current === turnId) return;

    client.sendEvent({ type: "response.cancel" });
    client.sendEvent({
      type: "response.create",
      response: {
        instructions: [
          "Начни или продолжи интервью с текущего вопроса.",
          `Текущий вопрос: ${question}`,
          "Скажи только естественную короткую подводку и сам вопрос. Не переходи к следующему вопросу самостоятельно.",
        ].join("\n"),
      },
    });
    announcedTurnRef.current = turnId;
  }, [question, status, turnId]);

  const stop = useCallback(() => {
    clientRef.current?.stop();
    clientRef.current = null;
    announcedTurnRef.current = null;
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
        onConnected() {
          setStatus("connected");
        },
        onDisconnected() {
          clientRef.current = null;
          announcedTurnRef.current = null;
          setStatus("idle");
          onError(
            "Голосовое соединение прервано. Можно продолжить отвечать текстом или подключиться снова.",
          );
        },
        onEvent(event) {
          const transcript = getCompletedRealtimeTranscript(event);
          if (!transcript || persistedMessagesRef.current.has(transcript.id)) return;
          const activeTurnId = turnIdRef.current;
          if (!activeTurnId) return;
          persistedMessagesRef.current.add(transcript.id);
          persistQueueRef.current = persistQueueRef.current
            .then(() =>
              appendDialogue({
                content: transcript.text,
                role: transcript.role,
                sessionId,
                turnId: activeTurnId,
              }).unwrap(),
            )
            .then(onWorkspaceRef.current)
            .catch((error) => {
              persistedMessagesRef.current.delete(transcript.id);
              onError(getApiErrorMessage(error));
            });
        },
      });
      clientRef.current = client;
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
