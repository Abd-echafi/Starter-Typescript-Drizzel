CREATE TYPE "public"."roles" AS ENUM('student', 'mentor', 'admin');--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"profile_image_url" varchar(1024),
	"roles" "roles" DEFAULT 'student' NOT NULL,
	"password_changed_at" timestamp,
	"email_verification_token" varchar(255),
	"email_verification_expires" timestamp,
	"is_email_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_index" ON "user" USING btree ("email");