ALTER TABLE "jobs" ADD COLUMN "input_blob_path" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "input_file_size" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "input_mime_type" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "original_filename" text;--> statement-breakpoint
CREATE INDEX "jobs_status_started_at_idx" ON "jobs" USING btree ("status","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_input_blob_path_unique" ON "jobs" USING btree ("input_blob_path") WHERE "jobs"."input_blob_path" is not null;