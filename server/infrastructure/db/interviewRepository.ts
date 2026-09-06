import { asc, eq } from "drizzle-orm";

import { getDb, schema } from "./client";

export class InterviewRepository {
  private readonly database = getDb();

  async findSessionById(id: string) {
    const [session] = await this.database
      .select()
      .from(schema.interviewSessions)
      .where(eq(schema.interviewSessions.id, id))
      .limit(1);
    return session ?? null;
  }

  async listTurns(sessionId: string) {
    return this.database
      .select()
      .from(schema.interviewTurns)
      .where(eq(schema.interviewTurns.sessionId, sessionId))
      .orderBy(
        asc(schema.interviewTurns.index),
        asc(schema.interviewTurns.createdAt),
      );
  }
}
