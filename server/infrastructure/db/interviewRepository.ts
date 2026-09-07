import { and, asc, eq } from "drizzle-orm";

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

  async findTurnById(sessionId: string, turnId: string) {
    const [turn] = await this.database
      .select()
      .from(schema.interviewTurns)
      .where(
        and(
          eq(schema.interviewTurns.sessionId, sessionId),
          eq(schema.interviewTurns.id, turnId),
        ),
      )
      .limit(1);
    return turn ?? null;
  }

  async saveTurnAnswer(sessionId: string, turnId: string, answer: string) {
    await this.database
      .update(schema.interviewTurns)
      .set({ answerTranscript: answer, answeredAt: new Date() })
      .where(
        and(
          eq(schema.interviewTurns.sessionId, sessionId),
          eq(schema.interviewTurns.id, turnId),
        ),
      );
  }

  async createTurn(input: {
    sessionId: string;
    index: number;
    kind: string;
    question: string;
    answerTranscript: string | null;
    metadata: unknown;
  }) {
    await this.database.insert(schema.interviewTurns).values({
      ...input,
      metadata: input.metadata as Record<string, unknown>,
    });
  }

  async updateTurnMetadata(
    sessionId: string,
    turnId: string,
    metadata: Record<string, unknown>,
  ) {
    await this.database
      .update(schema.interviewTurns)
      .set({ metadata })
      .where(
        and(
          eq(schema.interviewTurns.sessionId, sessionId),
          eq(schema.interviewTurns.id, turnId),
        ),
      );
  }

  async completeSession(sessionId: string) {
    await this.database
      .update(schema.interviewSessions)
      .set({ status: "done" })
      .where(eq(schema.interviewSessions.id, sessionId));
  }
}
