import { describe, expect, it } from "vitest";

describe("маршрут потокового ответа", () => {
  it("загружается без необъявленных обработчиков Nitro", async () => {
    await expect(
      import("../../server/api/interview/sessions/[id]/reply-stream.post"),
    ).resolves.toEqual(
      expect.objectContaining({
        default: expect.any(Function),
      }),
    );
  });
});
