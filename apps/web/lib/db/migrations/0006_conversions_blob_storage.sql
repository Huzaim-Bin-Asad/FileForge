ALTER TABLE "conversions" ADD COLUMN "input_blob_path" text;--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "output_blob_path" text;--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "input_file_size" integer;--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "input_mime_type" text;--> statement-breakpoint
CREATE UNIQUE INDEX "conversions_input_blob_path_unique" ON "conversions" USING btree ("input_blob_path") WHERE "conversions"."input_blob_path" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "conversions_output_blob_path_unique" ON "conversions" USING btree ("output_blob_path") WHERE "conversions"."output_blob_path" is not null;