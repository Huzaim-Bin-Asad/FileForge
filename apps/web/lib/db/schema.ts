import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
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
    /**
     * Legacy storage: the converted output as Postgres bytea. Null for
     * conversions recorded before file storage was added, and for every
     * conversion stored in Vercel Blob (see `outputBlobPath`). Never
     * migrated or cleared — downloads read it when there is no Blob path.
     */
    fileData: bytea("file_data"),
    /** Output MIME type. Populated for both bytea- and Blob-backed rows. */
    mimeType: text("mime_type"),
    /** Output size in bytes. Populated for both bytea- and Blob-backed rows. */
    fileSize: integer("file_size"),
    /**
     * Vercel Blob pathname (not a URL) of the uploaded input / converted
     * output, always `users/{userId}/conversions/{id}/(input|output).{ext}`
     * — see lib/blobStorage.ts. Null for legacy rows. The store is private,
     * so these are only readable server-side, through the download route.
     */
    inputBlobPath: text("input_blob_path"),
    outputBlobPath: text("output_blob_path"),
    /** Input size in bytes / MIME type as reported by the upload (may be null). */
    inputFileSize: integer("input_file_size"),
    inputMimeType: text("input_mime_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("conversions_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("conversions_collection_id_idx").on(table.collectionId),
    // One Blob object belongs to exactly one row, so deleting a row's Blobs
    // can never remove a file another row still points at. Also backs the
    // orphan sweep's path lookups.
    uniqueIndex("conversions_input_blob_path_unique")
      .on(table.inputBlobPath)
      .where(sql`${table.inputBlobPath} is not null`),
    uniqueIndex("conversions_output_blob_path_unique")
      .on(table.outputBlobPath)
      .where(sql`${table.outputBlobPath} is not null`),
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
 * row in `conversions` so a failed attempt can be recorded too.
 *
 * Since Phase 4, `/api/v1/convert` jobs run asynchronously (Vercel Queues
 * invokes lib/jobProcessor.ts after the request that created the job has
 * already returned) — this table is the durable, queryable source of truth
 * for a job's status while it's in flight, and `started_at` doubles as the
 * claim lease: see lib/jobProcessor.ts for the atomic claim query and the
 * staleness window used to reclaim a job whose processor never finished.
 * `/api/convert` (the session-authenticated web UI) still runs synchronously
 * and still uses this table exactly as before Phase 4.
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
    /**
     * The uploaded input, durable in Vercel Blob before the enqueueing
     * request returns (`users/{userId}/jobs/{id}/input.{ext}` — see
     * lib/blobStorage.ts). Only asynchronous jobs (Phase 4) set these; a job
     * created by the synchronous web UI leaves them null, since the input
     * never needs to outlive that request. The processor deletes the object
     * once the result is durably stored in `conversions`, so a null value on
     * a completed job doesn't imply one was never used.
     */
    inputBlobPath: text("input_blob_path"),
    inputFileSize: integer("input_file_size"),
    inputMimeType: text("input_mime_type"),
    /** The uploaded filename, needed to run the conversion and later record it — see above. */
    originalFilename: text("original_filename"),
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
    // Backs the stale-job reclaim query in lib/jobProcessor.ts (jobs stuck
    // "processing" past the claim lease) and a future recovery sweep.
    index("jobs_status_started_at_idx").on(table.status, table.startedAt),
    // One Blob object belongs to exactly one job, same reasoning as the two
    // conversions.*_blob_path indexes above.
    uniqueIndex("jobs_input_blob_path_unique")
      .on(table.inputBlobPath)
      .where(sql`${table.inputBlobPath} is not null`),
    check(
      "jobs_status_check",
      sql`${table.status} in ('queued', 'processing', 'completed', 'failed', 'cancelled')`
    ),
    check("jobs_progress_check", sql`${table.progress} between 0 and 100`),
  ]
);

export const USAGE_EVENT_TYPES = [
  "file_processed",
  "api_request",
  "bandwidth",
  "storage",
  "processing_time",
] as const;
export type UsageEventType = (typeof USAGE_EVENT_TYPES)[number];

/**
 * A durable, append-only record of measurable product usage, kept
 * independent of any subscription/billing concept (there isn't one yet —
 * see lib/usage.ts). Each row is one measured quantity of one type.
 *
 * Idempotency: `(job_id, type)` is unique, so "this job's file_processed
 * event" (or processing_time, or api_request) can be inserted at most once
 * no matter how many times the recording code path runs — retries use
 * `onConflictDoNothing` against this index rather than an app-level check.
 * Rows with a null job_id (usage not tied to a single job) are exempt from
 * that constraint, since Postgres treats each NULL as distinct; those rely
 * on the caller invoking the recorder at most once per real event.
 */
export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The job this usage was measured from, when there is one. */
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    type: text("type").$type<UsageEventType>().notNull(),
    /** Always a non-negative whole number — a count, milliseconds, or bytes; see `unit`. */
    amount: integer("amount").notNull(),
    /** e.g. "file", "request", "ms", "byte". Free text so future types aren't constrained here. */
    unit: text("unit").notNull(),
    /** Optional extra context (e.g. conversion type). Never loaded by the aggregate helpers. */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("usage_events_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("usage_events_user_id_type_created_at_idx").on(
      table.userId,
      table.type,
      table.createdAt
    ),
    index("usage_events_job_id_idx").on(table.jobId),
    uniqueIndex("usage_events_job_id_type_unique").on(table.jobId, table.type),
    check(
      "usage_events_type_check",
      sql`${table.type} in ('file_processed', 'api_request', 'bandwidth', 'storage', 'processing_time')`
    ),
    check("usage_events_amount_check", sql`${table.amount} >= 0`),
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
