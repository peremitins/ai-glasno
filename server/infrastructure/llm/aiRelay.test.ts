import { describe, expect, it, vi } from "vitest";

import { exchangeRealtimeSdpWithRelay } from "./aiRelay";

describe("голосовой AI Relay", () => {
  it("передаёт SDP через подписанный серверный запрос", async () => {
    const request = vi.fn(async () => new Response("answer-sdp"));
    vi.stubGlobal("fetch", request);

    await expect(
      exchangeRealtimeSdpWithRelay({
        config: {
          authSecret: "relay-secret",
          clientId: "glasno-local",
          enabled: true,
          url: "https://relay.example.test",
        },
        sdp: "offer-sdp",
        session: { model: "gpt-realtime-mini" },
      }),
    ).resolves.toBe("answer-sdp");

    expect(request).toHaveBeenCalledWith(
      "https://relay.example.test/v1/realtime/calls",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Relay-Client": "glasno-local" }),
        method: "POST",
      }),
    );
  });
});
