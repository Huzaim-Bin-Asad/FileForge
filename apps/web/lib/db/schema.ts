import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  check,
  customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  /** Null for Google-only accounts. */
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
  },
  (table) => [index("refresh_tokens_user_id_idx").on(table.userId)]
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("collections_user_id_idx").on(table.userId)]
);

export const conversions = pgTable(
  "conversions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id").references(() => collections.id, {
      onDelete: "set null",
    }),
    sourceFormat: text("source_format").notNull(),
    targetFormat: text("target_format").notNull(),
    originalFilename: text("original_filename").notNull(),
    /** Null for conversions recorded before file storage was added. */
    fileData: bytea("file_data"),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("conversions_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("conversions_collection_id_idx").on(table.collectionId),
  ]
);

export const JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/**
 * Lifecycle state for a conversion attempt, kept separate from the history
 * row in `conversions` so a failed attempt can be recorded too. Conversions
 * still run synchronously inside the request; this is not a work queue.
 */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Null until the conversion is recorded, and for failed/cancelled jobs. */
    conversionId: uuid("conversion_id").references(() => conversions.id, {
      onDelete: "set null",
    }),
    /** The conversion type requested, e.g. "pdf-word". */
    type: text("type").notNull(),
    status: text("status").$type<JobStatus>().notNull().default("queued"),
    /** 0–100. */
    progress: integer("progress").notNull().default(0),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    processingTimeMs: integer("processing_time_ms"),
  },
  (table) => [
    index("jobs_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("jobs_conversion_id_idx").on(table.conversionId),
    index("jobs_status_created_at_idx").on(table.status, table.createdAt),
    check(
      "jobs_status_check",
      sql`${table.status} in ('queued', 'processing', 'completed', 'failed', 'cancelled')`
    ),
    check("jobs_progress_check", sql`${table.progress} between 0 and 100`),
  ]
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [index("api_keys_user_id_idx").on(table.userId)]
);
