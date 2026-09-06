import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { H3Event } from "h3";
import { getCookie, setCookie } from "h3";

import { getRuntimeConfig } from "../config/runtimeConfig";
import { apiError } from "./apiError";

const COOKIE_NAME = "glasno_sid";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type SessionContext = {
  id: string;
  isAnonymous: boolean;
  fresh: boolean;
  userId?: string | null;
  role?: string | null;
  authSessionId?: string | null;
};

function sign(id: string, secret: string) {
  return createHmac("sha256", secret).update(id).digest("hex");
}

function isValidSignature(id: string, signature: string, secret: string) {
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(id, secret));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function getOrCreateAnonymousSession(event: H3Event): SessionContext {
  const secret = getRuntimeConfig().server.sessionSecret;
  const rawCookie = getCookie(event, COOKIE_NAME);

  if (rawCookie) {
    const separator = rawCookie.lastIndexOf(".");
    if (separator > 0) {
      const id = rawCookie.slice(0, separator);
      const signature = rawCookie.slice(separator + 1);
      if (id && signature && isValidSignature(id, signature, secret)) {
        return { id, isAnonymous: true, fresh: false };
      }
    }
  }

  const id = randomBytes(18).toString("base64url");
  setCookie(event, COOKIE_NAME, `${id}.${sign(id, secret)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });

  return { id, isAnonymous: true, fresh: true };
}

export function requireSession(event: H3Event): SessionContext {
  const session = event.context.session as SessionContext | undefined;
  if (!session) throw apiError("E_AUTH", "Сессия не инициализирована");
  return session;
}
