CREATE TYPE "public"."item_type" AS ENUM('restaurant');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('follow', 'review_like');--> statement-breakpoint
CREATE TABLE "collection_items" (
	"id" text PRIMARY KEY NOT NULL,
	"collection_id" text NOT NULL,
	"item_type" "item_type" DEFAULT 'restaurant' NOT NULL,
	"restaurant_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_items_restaurant_ref" CHECK ("collection_items"."item_type" <> 'restaurant' OR "collection_items"."restaurant_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"parent_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cuisines" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "cuisines_name_unique" UNIQUE("name"),
	CONSTRAINT "cuisines_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" text NOT NULL,
	"position" smallint NOT NULL,
	"restaurant_id" text NOT NULL,
	CONSTRAINT "favorites_user_id_position_pk" PRIMARY KEY("user_id","position"),
	CONSTRAINT "favorites_position_range" CHECK ("favorites"."position" BETWEEN 1 AND 4)
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id"),
	CONSTRAINT "follows_not_self" CHECK ("follows"."follower_id" <> "follows"."following_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"actor_id" text NOT NULL,
	"review_id" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"uploaded_by_id" text,
	"storage_key" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text NOT NULL,
	"cuisine_id" text,
	"price_level" smallint,
	"latitude" double precision,
	"longitude" double precision,
	"created_by_id" text,
	"rating_sum" integer DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"rating_avg" real GENERATED ALWAYS AS (CASE WHEN rating_count > 0 THEN rating_sum::real / rating_count / 2 END) STORED,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurants_price_level" CHECK ("restaurants"."price_level" BETWEEN 1 AND 4)
);
--> statement-breakpoint
CREATE TABLE "review_likes" (
	"user_id" text NOT NULL,
	"review_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_likes_user_id_review_id_pk" PRIMARY KEY("user_id","review_id")
);
--> statement-breakpoint
CREATE TABLE "review_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"rating" smallint NOT NULL,
	"body" text,
	"visited_on" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" BETWEEN 1 AND 10)
);
--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_parent_id_collections_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_photos" ADD CONSTRAINT "restaurant_photos_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_photos" ADD CONSTRAINT "restaurant_photos_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_cuisine_id_cuisines_id_fk" FOREIGN KEY ("cuisine_id") REFERENCES "public"."cuisines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_photos" ADD CONSTRAINT "review_photos_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collection_items_collection_restaurant_unique" ON "collection_items" USING btree ("collection_id","restaurant_id");--> statement-breakpoint
CREATE INDEX "collection_items_restaurant_idx" ON "collection_items" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "collections_owner_idx" ON "collections" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "collections_parent_idx" ON "collections" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_restaurant_unique" ON "favorites" USING btree ("user_id","restaurant_id");--> statement-breakpoint
CREATE INDEX "follows_following_idx" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "notifications_recipient_created_idx" ON "notifications" USING btree ("recipient_id","created_at");--> statement-breakpoint
CREATE INDEX "restaurant_photos_restaurant_idx" ON "restaurant_photos" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "restaurants_city_idx" ON "restaurants" USING btree ("city");--> statement-breakpoint
CREATE INDEX "restaurants_cuisine_idx" ON "restaurants" USING btree ("cuisine_id");--> statement-breakpoint
CREATE INDEX "restaurants_name_trgm_idx" ON "restaurants" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "review_likes_review_idx" ON "review_likes" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_photos_review_idx" ON "review_photos" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "reviews_user_visited_idx" ON "reviews" USING btree ("user_id","visited_on");--> statement-breakpoint
CREATE INDEX "reviews_restaurant_created_idx" ON "reviews" USING btree ("restaurant_id","created_at");--> statement-breakpoint
CREATE INDEX "reviews_created_idx" ON "reviews" USING btree ("created_at");