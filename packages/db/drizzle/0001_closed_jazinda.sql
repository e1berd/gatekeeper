CREATE TYPE "auth"."hook_delivery_status" AS ENUM('pending', 'delivered', 'exhausted');--> statement-breakpoint
CREATE TYPE "auth"."hook_event" AS ENUM('before_sign_up', 'after_sign_up', 'before_sign_in', 'after_sign_in', 'before_token_issue', 'before_org_create', 'after_org_create', 'after_invite_accepted', 'before_password_change');--> statement-breakpoint
CREATE TYPE "auth"."hook_kind" AS ENUM('sql', 'http');--> statement-breakpoint
CREATE TABLE "auth"."hook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"hook_id" uuid NOT NULL,
	"event" "auth"."hook_event" NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "auth"."hook_delivery_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."hooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"event" "auth"."hook_event" NOT NULL,
	"kind" "auth"."hook_kind" NOT NULL,
	"runs_inside_caller_transaction" boolean DEFAULT false NOT NULL,
	"target" text NOT NULL,
	"signing_secret_encrypted" text,
	"key_id" uuid,
	"timeout_ms" integer DEFAULT 3000 NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."hook_deliveries" ADD CONSTRAINT "hook_deliveries_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."hook_deliveries" ADD CONSTRAINT "hook_deliveries_hook_id_hooks_id_fk" FOREIGN KEY ("hook_id") REFERENCES "auth"."hooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."hooks" ADD CONSTRAINT "hooks_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hook_deliveries_due_idx" ON "auth"."hook_deliveries" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "hook_deliveries_hook_idx" ON "auth"."hook_deliveries" USING btree ("hook_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hooks_realm_event_target_uq" ON "auth"."hooks" USING btree ("realm_id","event","target");--> statement-breakpoint
CREATE INDEX "hooks_dispatch_idx" ON "auth"."hooks" USING btree ("realm_id","event","enabled","priority");