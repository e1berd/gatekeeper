CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "rbac";
--> statement-breakpoint
CREATE TYPE "auth"."aal" AS ENUM('aal1', 'aal2', 'aal3');--> statement-breakpoint
CREATE TYPE "auth"."factor_status" AS ENUM('unverified', 'verified');--> statement-breakpoint
CREATE TYPE "auth"."factor_type" AS ENUM('totp', 'webauthn', 'recovery_code');--> statement-breakpoint
CREATE TYPE "auth"."one_time_token_type" AS ENUM('confirmation', 'recovery', 'email_change', 'phone_change', 'invite', 'reauthentication');--> statement-breakpoint
CREATE TYPE "rbac"."scope_type" AS ENUM('global', 'org', 'resource');--> statement-breakpoint
CREATE TYPE "auth"."sso_type" AS ENUM('saml', 'oidc');--> statement-breakpoint
CREATE TYPE "auth"."user_status" AS ENUM('active', 'pending', 'locked', 'disabled');--> statement-breakpoint
CREATE TABLE "audit"."log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"actor_id" uuid,
	"on_behalf_of_id" uuid,
	"action" text NOT NULL,
	"target" text,
	"outcome" text DEFAULT 'success' NOT NULL,
	"ip" "inet",
	"user_agent" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"realm_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" "inet",
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."encryption_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid,
	"wrapped_dek" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"rotated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac"."entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"key" text NOT NULL,
	"limit" integer,
	"source" text DEFAULT 'plan' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."flow_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"user_id" uuid,
	"auth_code" text NOT NULL,
	"code_challenge" text,
	"code_challenge_method" text,
	"provider_type" text NOT NULL,
	"redirect_to" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac"."group_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"scope_type" "rbac"."scope_type" DEFAULT 'global' NOT NULL,
	"scope_id" text
);
--> statement-breakpoint
CREATE TABLE "rbac"."groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"realm_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"identity_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"email" "citext",
	"last_sign_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac"."invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role_id" uuid NOT NULL,
	"scope_type" "rbac"."scope_type" DEFAULT 'org' NOT NULL,
	"scope_id" text,
	"invited_by" uuid,
	"token_hash" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."mfa_factors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "auth"."factor_type" NOT NULL,
	"status" "auth"."factor_status" DEFAULT 'unverified' NOT NULL,
	"friendly_name" text,
	"secret_encrypted" text,
	"key_id" uuid,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."oidc_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sso_provider_id" uuid NOT NULL,
	"issuer" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_encrypted" text NOT NULL,
	"key_id" uuid,
	"scopes" text[] DEFAULT '{openid,profile,email}'::text[] NOT NULL,
	"claim_mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oidc_providers_sso_provider_id_unique" UNIQUE("sso_provider_id")
);
--> statement-breakpoint
CREATE TABLE "auth"."one_time_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "auth"."one_time_token_type" NOT NULL,
	"token_hash" text NOT NULL,
	"relates_to" text,
	"consumed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac"."organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"owner_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac"."permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."realms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "realms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "auth"."refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"parent_hash" text,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac"."role_parents" (
	"role_id" uuid NOT NULL,
	"parent_role_id" uuid NOT NULL,
	CONSTRAINT "role_parents_role_id_parent_role_id_pk" PRIMARY KEY("role_id","parent_role_id")
);
--> statement-breakpoint
CREATE TABLE "rbac"."role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "rbac"."roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"grantable_at" "rbac"."scope_type" DEFAULT 'global' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."saml_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sso_provider_id" uuid NOT NULL,
	"entity_id" text NOT NULL,
	"metadata_xml" text,
	"metadata_url" text,
	"name_id_format" text,
	"attribute_mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saml_providers_sso_provider_id_unique" UNIQUE("sso_provider_id")
);
--> statement-breakpoint
CREATE TABLE "auth"."saml_relay_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sso_provider_id" uuid NOT NULL,
	"request_id" text NOT NULL,
	"for_email" "citext",
	"redirect_to" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"realm_id" uuid NOT NULL,
	"aal" "auth"."aal" DEFAULT 'aal1' NOT NULL,
	"amr" text[] DEFAULT '{}'::text[] NOT NULL,
	"ip" "inet",
	"user_agent" text,
	"device_id" text,
	"not_after" timestamp with time zone,
	"refreshed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."signing_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid,
	"kid" text NOT NULL,
	"algorithm" text DEFAULT 'EdDSA' NOT NULL,
	"public_jwk" jsonb NOT NULL,
	"private_key_encrypted" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"rotated_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "signing_keys_kid_unique" UNIQUE("kid")
);
--> statement-breakpoint
CREATE TABLE "auth"."sso_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sso_provider_id" uuid NOT NULL,
	"realm_id" uuid NOT NULL,
	"domain" "citext" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."sso_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"type" "auth"."sso_type" NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac"."user_groups" (
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	CONSTRAINT "user_groups_user_id_group_id_pk" PRIMARY KEY("user_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "rbac"."user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"scope_type" "rbac"."scope_type" DEFAULT 'global' NOT NULL,
	"scope_id" text,
	"expires_at" timestamp with time zone,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" uuid NOT NULL,
	"email" "citext",
	"email_verified_at" timestamp with time zone,
	"phone" text,
	"phone_verified_at" timestamp with time zone,
	"password_hash" text,
	"password_changed_at" timestamp with time zone,
	"status" "auth"."user_status" DEFAULT 'active' NOT NULL,
	"banned_until" timestamp with time zone,
	"user_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"app_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"permissions_version" integer DEFAULT 1 NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"last_failed_at" timestamp with time zone,
	"last_sign_in_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."webauthn_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"sign_count" bigint DEFAULT 0 NOT NULL,
	"transports" text[] DEFAULT '{}'::text[] NOT NULL,
	"aaguid" uuid,
	"backup_eligible" boolean DEFAULT false NOT NULL,
	"backup_state" boolean DEFAULT false NOT NULL,
	"attestation_fmt" text,
	"name" text,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit"."log" ADD CONSTRAINT "log_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit"."log" ADD CONSTRAINT "log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit"."log" ADD CONSTRAINT "log_on_behalf_of_id_users_id_fk" FOREIGN KEY ("on_behalf_of_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."challenges" ADD CONSTRAINT "challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."challenges" ADD CONSTRAINT "challenges_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."encryption_keys" ADD CONSTRAINT "encryption_keys_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."entitlements" ADD CONSTRAINT "entitlements_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."flow_state" ADD CONSTRAINT "flow_state_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."flow_state" ADD CONSTRAINT "flow_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."group_roles" ADD CONSTRAINT "group_roles_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "rbac"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."group_roles" ADD CONSTRAINT "group_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "rbac"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."groups" ADD CONSTRAINT "groups_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."identities" ADD CONSTRAINT "identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."identities" ADD CONSTRAINT "identities_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."invitations" ADD CONSTRAINT "invitations_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."invitations" ADD CONSTRAINT "invitations_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "rbac"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."invitations" ADD CONSTRAINT "invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."mfa_factors" ADD CONSTRAINT "mfa_factors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."oidc_providers" ADD CONSTRAINT "oidc_providers_sso_provider_id_sso_providers_id_fk" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."one_time_tokens" ADD CONSTRAINT "one_time_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."organizations" ADD CONSTRAINT "organizations_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."organizations" ADD CONSTRAINT "organizations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."permissions" ADD CONSTRAINT "permissions_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."role_parents" ADD CONSTRAINT "role_parents_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "rbac"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."role_parents" ADD CONSTRAINT "role_parents_parent_role_id_roles_id_fk" FOREIGN KEY ("parent_role_id") REFERENCES "rbac"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "rbac"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "rbac"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."roles" ADD CONSTRAINT "roles_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."saml_providers" ADD CONSTRAINT "saml_providers_sso_provider_id_sso_providers_id_fk" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."saml_relay_states" ADD CONSTRAINT "saml_relay_states_sso_provider_id_sso_providers_id_fk" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."signing_keys" ADD CONSTRAINT "signing_keys_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sso_domains" ADD CONSTRAINT "sso_domains_sso_provider_id_sso_providers_id_fk" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sso_domains" ADD CONSTRAINT "sso_domains_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sso_providers" ADD CONSTRAINT "sso_providers_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."user_groups" ADD CONSTRAINT "user_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."user_groups" ADD CONSTRAINT "user_groups_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "rbac"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "rbac"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."user_roles" ADD CONSTRAINT "user_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_realm_id_realms_id_fk" FOREIGN KEY ("realm_id") REFERENCES "auth"."realms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_realm_created_idx" ON "audit"."log" USING btree ("realm_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit"."log" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit"."log" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "challenges_expiry_idx" ON "auth"."challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlements_uq" ON "rbac"."entitlements" USING btree ("subject_type","subject_id","key");--> statement-breakpoint
CREATE INDEX "entitlements_subject_idx" ON "rbac"."entitlements" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "flow_state_code_uq" ON "auth"."flow_state" USING btree ("auth_code");--> statement-breakpoint
CREATE UNIQUE INDEX "group_roles_uq" ON "rbac"."group_roles" USING btree ("group_id","role_id","scope_type","scope_id");--> statement-breakpoint
CREATE UNIQUE INDEX "groups_realm_name_uq" ON "rbac"."groups" USING btree ("realm_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "identities_provider_uq" ON "auth"."identities" USING btree ("realm_id","provider","provider_user_id");--> statement-breakpoint
CREATE INDEX "identities_user_idx" ON "auth"."identities" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_uq" ON "rbac"."invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_pending_uq" ON "rbac"."invitations" USING btree ("realm_id","email","scope_type","scope_id") WHERE "rbac"."invitations"."accepted_at" is null and "rbac"."invitations"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "invitations_scope_idx" ON "rbac"."invitations" USING btree ("scope_type","scope_id");--> statement-breakpoint
CREATE INDEX "mfa_factors_user_idx" ON "auth"."mfa_factors" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_time_tokens_hash_uq" ON "auth"."one_time_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "one_time_tokens_user_type_idx" ON "auth"."one_time_tokens" USING btree ("user_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "org_realm_slug_uq" ON "rbac"."organizations" USING btree ("realm_id","slug") WHERE "rbac"."organizations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "org_owner_idx" ON "rbac"."organizations" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_uq" ON "rbac"."permissions" USING btree ("realm_id","resource","action");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_hash_uq" ON "auth"."refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "refresh_tokens_session_idx" ON "auth"."refresh_tokens" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_realm_key_uq" ON "rbac"."roles" USING btree ("realm_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "saml_relay_request_uq" ON "auth"."saml_relay_states" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "auth"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_active_idx" ON "auth"."sessions" USING btree ("user_id") WHERE "auth"."sessions"."revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sso_domains_uq" ON "auth"."sso_domains" USING btree ("realm_id","domain");--> statement-breakpoint
CREATE INDEX "sso_providers_realm_idx" ON "auth"."sso_providers" USING btree ("realm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_uq" ON "rbac"."user_roles" USING btree ("user_id","role_id","scope_type","scope_id");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "rbac"."user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_scope_idx" ON "rbac"."user_roles" USING btree ("scope_type","scope_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_realm_email_uq" ON "auth"."users" USING btree ("realm_id","email") WHERE "auth"."users"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_realm_phone_uq" ON "auth"."users" USING btree ("realm_id","phone") WHERE "auth"."users"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "users_realm_created_idx" ON "auth"."users" USING btree ("realm_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "webauthn_credential_id_uq" ON "auth"."webauthn_credentials" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "webauthn_user_idx" ON "auth"."webauthn_credentials" USING btree ("user_id");