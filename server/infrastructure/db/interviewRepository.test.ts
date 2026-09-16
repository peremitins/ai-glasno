import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { schema } from "./client";
import { InterviewRepository } from "./interviewRepository";

const database = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("./client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./client")>();
  return { ...actual, getDb: database.getDb };
});

describe("InterviewRepository.deleteSession", () => {
  it("удаляет зависимые записи в одной транзакции до сессии", async () => {
    const statements: string[] = [];
    const transaction = vi.fn(async <T>(callback: (tx: typeof tx) => Promise<T>) =>
      callback(tx),
    );
    const tx = {
      execute: async (query: Parameters<PgDialect["sqlToQuery"]>[0]) => {
        statements.push(new PgDialect().sqlToQuery(query).sql);
      },
      delete: (table: unknown) => ({
        where: async () => {
          statements.push(
            table === schema.interviewTurns
              ? "DELETE interview_turns"
              : "DELETE interview_sessions",
          );
        },
      }),
    };

    database.getDb.mockReturnValue({
      transaction,
      delete: () => ({ where: async () => undefined }),
    });

    await new InterviewRepository().deleteSession("session-1");

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(statements).toEqual(
      expect.arrayContaining([
        expect.stringContaining("UPDATE \"realtime_minute_debits\""),
        expect.stringContaining("DELETE FROM \"realtime_voice_sessions\""),
        expect.stringContaining("DELETE FROM \"ai_usage\""),
        expect.stringContaining("DELETE FROM \"interview_reports\""),
        "DELETE interview_turns",
        "DELETE interview_sessions",
      ]),
    );
    expect(statements.indexOf("DELETE interview_turns")).toBeLessThan(
      statements.indexOf("DELETE interview_sessions"),
    );
  });
});
