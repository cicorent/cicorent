CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."coverage" AS ENUM('BASE', 'PARTIAL');--> statement-breakpoint
CREATE TYPE "public"."km_plan" AS ENUM('KM_100', 'KM_200', 'UNLIMITED');--> statement-breakpoint
CREATE TYPE "public"."package_type" AS ENUM('STANDARD_24H', 'THREE_DAYS', 'FIVE_DAYS', 'WEEKLY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('STAFF', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('VAN', 'CAR');--> statement-breakpoint
CREATE TABLE "blackout_dates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" varchar NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_sequence" (
	"id" serial PRIMARY KEY NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_code" varchar NOT NULL,
	"vehicle_id" varchar NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days_count" integer NOT NULL,
	"package_type" "package_type" NOT NULL,
	"km_plan" "km_plan" NOT NULL,
	"coverage" "coverage" NOT NULL,
	"extra_driver" boolean DEFAULT false NOT NULL,
	"extra_driver_under25" boolean DEFAULT false NOT NULL,
	"home_delivery" boolean DEFAULT false NOT NULL,
	"home_pickup" boolean DEFAULT false NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"discount_euro_shown" numeric(10, 2) NOT NULL,
	"discount_pct_shown" numeric(5, 2) NOT NULL,
	"customer_first_name" text NOT NULL,
	"customer_last_name" text NOT NULL,
	"customer_birth_date" date NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text NOT NULL,
	"driver_license_no" text NOT NULL,
	"add_first_name" text,
	"add_last_name" text,
	"add_birth_date" date,
	"add_driver_license_no" text,
	"notes" text,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_code_unique" UNIQUE("booking_code")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'STAFF' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar NOT NULL,
	"type" "vehicle_type" NOT NULL,
	"base_price_day" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"available_quantity" integer NOT NULL,
	"color_options" text[] NOT NULL,
	"seats" integer NOT NULL,
	"transmission" varchar(10) NOT NULL,
	"fuel_type" varchar(10) NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blackout_dates" ADD CONSTRAINT "blackout_dates_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;