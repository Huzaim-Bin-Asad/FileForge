CREATE TABLE "backup_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_change_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"new_email" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_secret_enc" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_enabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "theme_background" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "theme_accent" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "theme_text" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_blob_path" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_mime_type" text;--> statement-breakpoint
ALTER TABLE "backup_codes" ADD CONSTRAINT "backup_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_change_tokens" ADD CONSTRAINT "email_change_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "backup_codes_user_id_idx" ON "backup_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_change_tokens_user_id_idx" ON "email_change_tokens" USING btree ("user_id");