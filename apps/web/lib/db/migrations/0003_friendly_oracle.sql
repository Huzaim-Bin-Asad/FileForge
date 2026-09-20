ALTER TABLE "conversions" ADD COLUMN "file_data" "bytea";--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "mime_type" text;--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "file_size" integer;