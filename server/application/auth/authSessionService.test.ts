import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

import { AuthSessionService } from "./authSessionService";

describe("сервис авторизационной сессии", () => {
  it("принимает только подписанную cookie с действительным токеном", async () => {
    const repository = {
      findAuthSessionById: vi.fn().mockResolvedValue({
        id: "auth-session-01",
        userId: "user-01",
        tokenHash: createHash("sha256").update("test-token").digest("hex"),
        csrfTokenHash: "csrf-hash",
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
        revokedAt: null,
      }),
      findUserById: vi.fn().mockResolvedValue({
        id: "user-01",
        role: "user",
      }),
      touchAuthSession: vi.fn().mockResolvedValue(undefined),
    };
    const service = new AuthSessionService({
      repository,
      sessionSecret: "test-session-secret",
    });
    const cookie = service.signCookieValue("auth-session-01", "test-token");

    await expect(service.resolveFromCookie(cookie)).resolves.toMatchObject({
      user: { id: "user-01" },
    });
    await expect(
      service.resolveFromCookie(`${cookie}changed`),
    ).resolves.toBeNull();
    expect(repository.touchAuthSession).toHaveBeenCalledWith("auth-session-01");
  });
});
