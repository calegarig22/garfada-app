ALTER TABLE "restaurant_photos" ALTER COLUMN "storage_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurant_photos" ADD COLUMN "external_url" text;--> statement-breakpoint
ALTER TABLE "restaurant_photos" ADD COLUMN "attribution" text;--> statement-breakpoint
ALTER TABLE "restaurant_photos" ADD COLUMN "attribution_url" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "google_place_id" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_google_place_id_unique" UNIQUE("google_place_id");--> statement-breakpoint
ALTER TABLE "restaurant_photos" ADD CONSTRAINT "restaurant_photos_has_source" CHECK ("restaurant_photos"."storage_key" IS NOT NULL OR "restaurant_photos"."external_url" IS NOT NULL);