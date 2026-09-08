import { describe, expect, it } from "vitest";

describe("маршрут SDP-обмена голосового интервью", () => {
  it("загружается как защищённый серверный обработчик", async () => {
    await expect(
      import("../../server/api/interview/sessions/[id]/realtime-sdp.post"),
    ).resolves.toEqual(
      expect.objectContaining({
        default: expect.any(Function),
      }),
    );
  });
});
