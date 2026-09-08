import { defineEventHandler, getCookie, getHeader } from "h3";

import { CSRF_COOKIE_NAME } from "../application/auth/authSessionService";
import { createAuthSessionService } from "../application/auth/serviceFactory";
import { apiError } from "../utils/apiError";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const exemptPaths = new Set([
  "/api/auth/email/start",
  "/api/auth/email/verify",
  "/api/auth/telegram/login",
  "/api/auth/magic/consume",
]);

export default defineEventHandler((event) => {
  if (
    !event.path?.startsWith("/api/interview") &&
    !event.path?.startsWith("/api/auth")
  ) {
    return;
  }
  if (safeMethods.has(event.method) || exemptPaths.has(event.path)) return;

  const auth = event.context.auth as
    | {
        session: Parameters<
          ReturnType<typeof createAuthSessionService>["validateCsrf"]
        >[0]["session"];
      }
    | undefined;
  if (!auth) return;

  const valid = createAuthSessionService().validateCsrf({
    session: auth.session,
    cookieToken: getCookie(event, CSRF_COOKIE_NAME),
    headerToken: getHeader(event, "x-csrf-token"),
  });
  if (!valid) {
    throw apiError("E_FORBIDDEN", "CSRF-токен не прошёл проверку");
  }
});
