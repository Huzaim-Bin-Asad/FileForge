CREATE TABLE "convert_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "convert_sessions" ADD CONSTRAINT "convert_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "convert_sessions_user_id_updated_at_idx" ON "convert_sessions" USING btree ("user_id","updated_at");--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_session_id_convert_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."convert_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jobs_session_id_created_at_idx" ON "jobs" USING btree ("session_id","created_at");