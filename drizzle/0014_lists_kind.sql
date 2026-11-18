ALTER TABLE "collections" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "kind" text;--> statement-breakpoint
CREATE UNIQUE INDEX "collections_owner_kind_unique" ON "collections" USING btree ("owner_id","kind") WHERE "collections"."kind" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_name_len" CHECK (char_length("collections"."name") BETWEEN 1 AND 60);