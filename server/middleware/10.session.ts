import { deleteCookie, defineEventHandler, getCookie } from "h3";

import { AUTH_COOKIE_NAME } from "../application/auth/authSessionService";
import { createAuthSessionService } from "../application/auth/serviceFactory";
import { getOrCreateAnonymousSession } from "../utils/session";

export default defineEventHandler(async (event) => {
  if (
    !event.path?.startsWith("/api/interview") &&
    !event.path?.startsWith("/api/auth")
  ) {
    return;
  }

  const anonymousSession = getOrCreateAnonymousSession(event);
  event.context.session = anonymousSession;

  const cookie = getCookie(event, AUTH_COOKIE_NAME);
  if (!cookie) return;

  const auth = await createAuthSessionService().resolveFromCookie(cookie);
  if (!auth) {
    deleteCookie(event, AUTH_COOKIE_NAME, { path: "/" });
    return;
  }

  event.context.auth = auth;
  event.context.session = {
    ...anonymousSession,
    isAnonymous: false,
    userId: auth.user.id,
    role: auth.user.role,
    authSessionId: auth.session.id,
  };
});
