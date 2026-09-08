import { and, eq, isNull } from "drizzle-orm";

import { getDb, schema } from "../db/client";

export class DrizzleAuthRepository {
  private readonly database = getDb();

  async findAuthSessionById(id: string) {
    const [session] = await this.database
      .select()
      .from(schema.authSessions)
      .where(eq(schema.authSessions.id, id))
      .limit(1);
    return session ?? null;
  }

  async findUserById(id: string) {
    const [user] = await this.database
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where(and(eq(schema.users.id, id), isNull(schema.users.deletedAt)))
      .limit(1);
    return user ?? null;
  }

  async touchAuthSession(id: string) {
    await this.database
      .update(schema.authSessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(schema.authSessions.id, id));
  }
}
