import { getRuntimeConfig } from "../../config/runtimeConfig";
import { DrizzleAuthRepository } from "../../infrastructure/auth/drizzleAuthRepository";
import { AuthSessionService } from "./authSessionService";

export function createAuthSessionService() {
  return new AuthSessionService({
    repository: new DrizzleAuthRepository(),
    sessionSecret: getRuntimeConfig().server.sessionSecret,
  });
}
