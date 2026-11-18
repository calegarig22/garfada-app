ALTER TYPE "public"."notification_type" ADD VALUE 'review_comment';--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_comments_body_len" CHECK (char_length("review_comments"."body") BETWEEN 1 AND 500)
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "comment_id" text;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_comments_review_created_idx" ON "review_comments" USING btree ("review_id","created_at");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_comment_id_review_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."review_comments"("id") ON DELETE cascade ON UPDATE no action;