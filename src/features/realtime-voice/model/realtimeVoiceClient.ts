export type RealtimeVoiceClient = {
  sendEvent: (event: Record<string, unknown>) => void;
  stop: () => void;
};

type StartRealtimeVoiceClientOptions = {
  exchangeSdp: (offerSdp: string) => Promise<string>;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onEvent?: (event: unknown) => void;
  onRemoteStream?: (stream: MediaStream) => void;
};

export async function startRealtimeVoiceClient(
  options: StartRealtimeVoiceClientOptions,
): Promise<RealtimeVoiceClient> {
  if (
    typeof window === "undefined" ||
    typeof RTCPeerConnection !== "function"
  ) {
    throw new Error(
      "Браузер не поддерживает голосовой режим в реальном времени.",
    );
  }
  if (typeof navigator.mediaDevices?.getUserMedia !== "function") {
    throw new Error("Браузер не поддерживает захват микрофона.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const peerConnection = new RTCPeerConnection();
  const channel = peerConnection.createDataChannel("oai-events");
  let stopped = false;

  for (const track of stream.getTracks()) {
    peerConnection.addTrack(track, stream);
  }

  peerConnection.ontrack = (event) => {
    const [remoteStream] = event.streams;
    if (remoteStream) options.onRemoteStream?.(remoteStream);
  };
  channel.onmessage = (event) => {
    try {
      options.onEvent?.(JSON.parse(event.data));
    } catch {
      options.onEvent?.(event.data);
    }
  };
  channel.onopen = () => options.onConnected?.();
  channel.onclose = () => {
    if (stopped) return;
    stop();
    options.onDisconnected?.();
  };
  peerConnection.onconnectionstatechange = () => {
    if (
      !stopped &&
      (peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "disconnected")
    ) {
      stop();
      options.onDisconnected?.();
    }
  };

  try {
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
    });
    await peerConnection.setLocalDescription(offer);
    const offerSdp = peerConnection.localDescription?.sdp;
    if (!offerSdp)
      throw new Error("Не удалось сформировать голосовое соединение.");

    const answerSdp = await options.exchangeSdp(offerSdp);
    if (stopped) throw new Error("Голосовое соединение отменено.");
    await peerConnection.setRemoteDescription({
      type: "answer",
      sdp: answerSdp,
    });
    if (channel.readyState === "open") options.onConnected?.();
  } catch (error) {
    stop();
    throw error;
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    try {
      channel.close();
    } catch {
      // Канал мог быть закрыт браузером.
    }
    for (const track of stream.getTracks()) track.stop();
    peerConnection.close();
  }

  return {
    sendEvent(event) {
      if (channel.readyState === "open") channel.send(JSON.stringify(event));
    },
    stop,
  };
}
