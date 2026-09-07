ALTER TABLE "auth"."flow_state" ADD COLUMN "state_hash" text;--> statement-breakpoint
ALTER TABLE "auth"."flow_state" ADD COLUMN "auth_code_hash" text;--> statement-breakpoint
ALTER TABLE "auth"."flow_state" ADD COLUMN "provider_verifier_encrypted" text;--> statement-breakpoint
CREATE UNIQUE INDEX "flow_state_state_uq" ON "auth"."flow_state" USING btree ("state_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "flow_state_auth_code_uq" ON "auth"."flow_state" USING btree ("auth_code_hash");