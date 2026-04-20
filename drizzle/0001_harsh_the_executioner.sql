CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."hall_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "booking" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text NOT NULL,
	"booker_user_id" text NOT NULL,
	"event_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"guest_count" integer NOT NULL,
	"currency" text DEFAULT 'MYR' NOT NULL,
	"hall_rental_fee_myr" integer NOT NULL,
	"cleaning_fee_myr" integer DEFAULT 0 NOT NULL,
	"service_fee_myr" integer DEFAULT 0 NOT NULL,
	"total_fee_myr" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amenity" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hall" (
	"id" text PRIMARY KEY NOT NULL,
	"host_user_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text,
	"country" text DEFAULT 'Malaysia' NOT NULL,
	"max_capacity" integer NOT NULL,
	"base_price_myr" integer NOT NULL,
	"cleaning_fee_myr" integer DEFAULT 0 NOT NULL,
	"service_fee_myr" integer DEFAULT 0 NOT NULL,
	"cover_photo_url" text,
	"status" "hall_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hall_amenities" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text NOT NULL,
	"amenity_id" text,
	"custom_amenity" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hall_photo" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text NOT NULL,
	"url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "host_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"company_name" text,
	"bio" text,
	"city" text,
	"state" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "host_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_hall_id_hall_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."hall"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_booker_user_id_user_id_fk" FOREIGN KEY ("booker_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hall" ADD CONSTRAINT "hall_host_user_id_user_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hall_amenities" ADD CONSTRAINT "hall_amenities_hall_id_hall_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."hall"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hall_amenities" ADD CONSTRAINT "hall_amenities_amenity_id_amenity_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenity"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hall_photo" ADD CONSTRAINT "hall_photo_hall_id_hall_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."hall"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_profile" ADD CONSTRAINT "host_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_hall_id_idx" ON "booking" USING btree ("hall_id");--> statement-breakpoint
CREATE INDEX "booking_booker_user_id_idx" ON "booking" USING btree ("booker_user_id");--> statement-breakpoint
CREATE INDEX "booking_event_date_idx" ON "booking" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "booking_status_idx" ON "booking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "booking_payment_status_idx" ON "booking" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "booking_hall_date_idx" ON "booking" USING btree ("hall_id","event_date");--> statement-breakpoint
CREATE UNIQUE INDEX "amenity_slug_unique_idx" ON "amenity" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "amenity_label_unique_idx" ON "amenity" USING btree ("label");--> statement-breakpoint
CREATE INDEX "amenity_is_active_idx" ON "amenity" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "hall_slug_unique_idx" ON "hall" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "hall_host_user_id_idx" ON "hall" USING btree ("host_user_id");--> statement-breakpoint
CREATE INDEX "hall_city_state_idx" ON "hall" USING btree ("city","state");--> statement-breakpoint
CREATE INDEX "hall_status_idx" ON "hall" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hall_amenities_hall_id_idx" ON "hall_amenities" USING btree ("hall_id");--> statement-breakpoint
CREATE INDEX "hall_amenities_amenity_id_idx" ON "hall_amenities" USING btree ("amenity_id");--> statement-breakpoint
CREATE INDEX "hall_amenities_hall_sort_idx" ON "hall_amenities" USING btree ("hall_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "hall_amenities_hall_amenity_unique_idx" ON "hall_amenities" USING btree ("hall_id","amenity_id");--> statement-breakpoint
CREATE INDEX "hall_photo_hall_id_idx" ON "hall_photo" USING btree ("hall_id");--> statement-breakpoint
CREATE INDEX "hall_photo_hall_sort_idx" ON "hall_photo" USING btree ("hall_id","sort_order");--> statement-breakpoint
CREATE INDEX "host_profile_user_id_idx" ON "host_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "host_profile_city_idx" ON "host_profile" USING btree ("city");