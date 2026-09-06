import {
  createOpaqueToken,
  hashOpaqueToken,
  hmacHex,
  safeEqual,
} from "./authCrypto";

export const AUTH_COOKIE_NAME = "glasno_auth";
export const CSRF_COOKIE_NAME = "glasno_csrf";
export const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type AuthSessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  csrfTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

type AuthUserRecord = { id: string; role: string };

type AuthRepository = {
  createAuthSession?: (input: {
    userId: string;
    tokenHash: string;
    csrfTokenHash: string;
    expiresAt: Date;
  }) => Promise<AuthSessionRecord>;
  findAuthSessionById: (id: string) => Promise<AuthSessionRecord | null>;
  findUserById: (id: string) => Promise<AuthUserRecord | null>;
  touchAuthSession: (id: string) => Promise<void>;
};

export class AuthSessionService {
  constructor(
    private readonly dependencies: {
      repository: AuthRepository;
      sessionSecret: string;
    },
  ) {}

  async createForUser(userId: string) {
    if (!this.dependencies.repository.createAuthSession) {
      throw new Error(
        "Репозиторий не поддерживает создание авторизационной сессии",
      );
    }

    const token = createOpaqueToken();
    const csrfToken = createOpaqueToken();
    const expiresAt = new Date(Date.now() + AUTH_SESSION_TTL_SECONDS * 1000);
    const session = await this.dependencies.repository.createAuthSession({
      userId,
      tokenHash: hashOpaqueToken(token),
      csrfTokenHash: hashOpaqueToken(csrfToken),
      expiresAt,
    });

    return {
      session,
      csrfToken,
      cookieValue: this.signCookieValue(session.id, token),
    };
  }

  async resolveFromCookie(rawCookie: string | null | undefined) {
    const parsed = this.parseCookieValue(rawCookie);
    if (!parsed) return null;

    const session = await this.dependencies.repository.findAuthSessionById(
      parsed.sessionId,
    );
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      !safeEqual(session.tokenHash, hashOpaqueToken(parsed.token))
    ) {
      return null;
    }

    const user = await this.dependencies.repository.findUserById(
      session.userId,
    );
    if (!user) return null;

    await this.dependencies.repository.touchAuthSession(session.id);
    return { session, user };
  }

  validateCsrf(params: {
    session: AuthSessionRecord;
    cookieToken: string | null | undefined;
    headerToken: string | null | undefined;
  }) {
    const { session, cookieToken, headerToken } = params;
    if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
      return false;
    }

    return safeEqual(session.csrfTokenHash, hashOpaqueToken(cookieToken));
  }

  signCookieValue(sessionId: string, token: string) {
    const value = `${sessionId}.${token}`;
    return `${value}.${hmacHex(this.dependencies.sessionSecret, value)}`;
  }

  private parseCookieValue(rawCookie: string | null | undefined) {
    if (!rawCookie) return null;
    const parts = rawCookie.split(".");
    if (parts.length !== 3) return null;

    const [sessionId, token, signature] = parts;
    if (!sessionId || !token || !signature) return null;

    const value = `${sessionId}.${token}`;
    if (
      !safeEqual(hmacHex(this.dependencies.sessionSecret, value), signature)
    ) {
      return null;
    }

    return { sessionId, token };
  }
}
