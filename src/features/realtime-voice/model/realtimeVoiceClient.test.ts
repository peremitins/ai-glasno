import { afterEach, describe, expect, it, vi } from "vitest";

import { startRealtimeVoiceClient } from "./realtimeVoiceClient";

describe("Realtime voice client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("передаёт микрофон по WebRTC, обменивает SDP и освобождает ресурсы", async () => {
    const track = { stop: vi.fn() } as unknown as MediaStreamTrack;
    const stream = {
      getTracks: () => [track],
    } as unknown as MediaStream;
    const channel = {
      close: vi.fn(),
      readyState: "open",
      send: vi.fn(),
    } as unknown as RTCDataChannel;
    const peerConnection = {
      addTrack: vi.fn(),
      close: vi.fn(),
      createDataChannel: vi.fn(() => channel),
      createOffer: vi.fn(async () => ({ type: "offer", sdp: "offer-sdp" })),
      getSenders: vi.fn(() => [{ track }]),
      localDescription: { type: "offer", sdp: "offer-sdp" },
      setLocalDescription: vi.fn(),
      setRemoteDescription: vi.fn(),
    } as unknown as RTCPeerConnection;
    const getUserMedia = vi.fn(async () => stream);

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    function MockPeerConnection() {
      return peerConnection;
    }
    vi.stubGlobal("RTCPeerConnection", MockPeerConnection);

    const client = await startRealtimeVoiceClient({
      exchangeSdp: vi.fn(async (offerSdp) => {
        expect(offerSdp).toBe("offer-sdp");
        return "answer-sdp";
      }),
    });

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(peerConnection.addTrack).toHaveBeenCalledWith(track, stream);
    expect(peerConnection.createDataChannel).toHaveBeenCalledWith("oai-events");
    expect(peerConnection.setRemoteDescription).toHaveBeenCalledWith({
      type: "answer",
      sdp: "answer-sdp",
    });

    client.stop();

    expect(track.stop).toHaveBeenCalled();
    expect(channel.close).toHaveBeenCalled();
    expect(peerConnection.close).toHaveBeenCalled();
  });

  it("сообщает о разрыве канала, чтобы интерфейс вернул текстовый fallback", async () => {
    const track = { stop: vi.fn() } as unknown as MediaStreamTrack;
    const stream = {
      getTracks: () => [track],
    } as unknown as MediaStream;
    const channel = {
      close: vi.fn(),
      readyState: "open",
      send: vi.fn(),
    } as unknown as RTCDataChannel;
    const peerConnection = {
      addTrack: vi.fn(),
      close: vi.fn(),
      createDataChannel: vi.fn(() => channel),
      createOffer: vi.fn(async () => ({ type: "offer", sdp: "offer-sdp" })),
      localDescription: { type: "offer", sdp: "offer-sdp" },
      setLocalDescription: vi.fn(),
      setRemoteDescription: vi.fn(),
    } as unknown as RTCPeerConnection;
    const onDisconnected = vi.fn();

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => stream) },
    });
    vi.stubGlobal("RTCPeerConnection", function MockPeerConnection() {
      return peerConnection;
    });

    await startRealtimeVoiceClient({
      exchangeSdp: vi.fn(async () => "answer-sdp"),
      onDisconnected,
    });

    channel.onclose?.(new Event("close"));

    expect(onDisconnected).toHaveBeenCalledOnce();
    expect(track.stop).toHaveBeenCalledOnce();
    expect(peerConnection.close).toHaveBeenCalledOnce();
  });

  it("подтверждает готовность только после открытия канала событий", async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const channel = {
      close: vi.fn(),
      readyState: "connecting",
      send: vi.fn(),
    } as unknown as RTCDataChannel;
    const peerConnection = {
      addTrack: vi.fn(),
      close: vi.fn(),
      createDataChannel: vi.fn(() => channel),
      createOffer: vi.fn(async () => ({ type: "offer", sdp: "offer-sdp" })),
      localDescription: { type: "offer", sdp: "offer-sdp" },
      setLocalDescription: vi.fn(),
      setRemoteDescription: vi.fn(),
    } as unknown as RTCPeerConnection;
    const onConnected = vi.fn();

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => stream) },
    });
    vi.stubGlobal("RTCPeerConnection", function MockPeerConnection() {
      return peerConnection;
    });

    await startRealtimeVoiceClient({
      exchangeSdp: vi.fn(async () => "answer-sdp"),
      onConnected,
    });

    expect(onConnected).not.toHaveBeenCalled();
    channel.onopen?.(new Event("open"));
    expect(onConnected).toHaveBeenCalledOnce();
  });
});
