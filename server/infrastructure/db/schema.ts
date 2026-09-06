import {
  jsonb,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  role: text("role").default("user").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  tokenHash: text("token_hash").unique().notNull(),
  csrfTokenHash: text("csrf_token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  anonymousSessionId: text("anonymous_session_id").notNull(),
  trainingMode: text("training_mode").default("candidate").notNull(),
  source: text("source").notNull(),
  vacancyTitle: text("vacancy_title"),
  vacancyUrl: text("vacancy_url"),
  companyName: text("company_name"),
  vacancyRaw: text("vacancy_raw"),
  resumeRaw: text("resume_raw"),
  role: text("role"),
  level: text("level"),
  format: integer("format"),
  questionCount: integer("question_count").default(3).notNull(),
  language: text("language").default("ru").notNull(),
  interviewerMode: text("interviewer_mode"),
  interviewerAvatarId: text("interviewer_avatar_id")
    .default("neutral-pro")
    .notNull(),
  status: text("status").default("created").notNull(),
  metadata: jsonb("metadata"),
  creatorIpHash: text("creator_ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const interviewTurns = pgTable("interview_turns", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => interviewSessions.id)
    .notNull(),
  index: integer("index").notNull(),
  kind: text("kind").default("main").notNull(),
  question: text("question").notNull(),
  answerTranscript: text("answer_transcript"),
  followUpForTurnId: uuid("follow_up_for_turn_id"),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
