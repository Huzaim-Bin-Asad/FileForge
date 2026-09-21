CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"unit" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_events_type_check" CHECK ("usage_events"."type" in ('file_processed', 'api_request', 'bandwidth', 'storage', 'processing_time')),
	CONSTRAINT "usage_events_amount_check" CHECK ("usage_events"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "usage_events_user_id_created_at_idx" ON "usage_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_events_user_id_type_created_at_idx" ON "usage_events" USING btree ("user_id","type","created_at");--> statement-breakpoint
CREATE INDEX "usage_events_job_id_idx" ON "usage_events" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_events_job_id_type_unique" ON "usage_events" USING btree ("job_id","type");