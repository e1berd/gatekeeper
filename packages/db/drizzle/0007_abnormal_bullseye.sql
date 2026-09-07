DROP INDEX "auth"."flow_state_code_uq";--> statement-breakpoint
ALTER TABLE "auth"."flow_state" DROP COLUMN "auth_code";