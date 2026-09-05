-- ─────────────────────────────────────────────────────────────────────────────
-- Permission resolution.
--
-- Answers "which permissions does this subject hold in this scope" by walking
-- three sources at once: direct grants, grants inherited through groups, and
-- roles reachable through the role-inheritance graph.
--
-- Global grants always apply, so a scoped query returns scoped grants *plus*
-- global ones. That is what lets a platform administrator act inside every
-- workspace without a row per workspace.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function rbac.effective_role_ids(
  p_user_id uuid,
  p_scope_type text default 'global',
  p_scope_id text default null
) returns table (role_id uuid, granted_role_id uuid, scope_type text, scope_id text)
language sql stable parallel safe as $$
  with recursive granted as (
    -- Direct grants, live ones only.
    select ur.role_id, ur.role_id as granted_role_id,
           ur.scope_type::text, ur.scope_id
    from rbac.user_roles ur
    where ur.user_id = p_user_id
      and (ur.expires_at is null or ur.expires_at > now())
      and (ur.scope_type = 'global'
           or (ur.scope_type::text = p_scope_type and ur.scope_id is not distinct from p_scope_id))

    union all

    -- Grants reaching the user through group membership.
    select gr.role_id, gr.role_id, gr.scope_type::text, gr.scope_id
    from rbac.group_roles gr
    join rbac.user_groups ug on ug.group_id = gr.group_id
    where ug.user_id = p_user_id
      and (gr.scope_type = 'global'
           or (gr.scope_type::text = p_scope_type and gr.scope_id is not distinct from p_scope_id))
  ),
  expanded as (
    select g.role_id, g.granted_role_id, g.scope_type, g.scope_id
    from granted g

    union

    -- Follow inheritance edges upward: holding a role implies holding its parents.
    select rp.parent_role_id, e.granted_role_id, e.scope_type, e.scope_id
    from expanded e
    join rbac.role_parents rp on rp.role_id = e.role_id
  )
  select distinct role_id, granted_role_id, scope_type, scope_id from expanded;
$$;

create or replace function rbac.effective_permissions(
  p_user_id uuid,
  p_scope_type text default 'global',
  p_scope_id text default null
) returns table (permission text, via_role text, granted_scope_type text, granted_scope_id text)
language sql stable parallel safe as $$
  select distinct
    p.resource || ':' || p.action as permission,
    gr.key                        as via_role,
    e.scope_type,
    e.scope_id
  from rbac.effective_role_ids(p_user_id, p_scope_type, p_scope_id) e
  join rbac.role_permissions rp on rp.role_id = e.role_id
  join rbac.permissions p       on p.id = rp.permission_id
  join rbac.roles gr            on gr.id = e.granted_role_id;
$$;

-- Single-question form. Short-circuits on the first matching grant, so it stays
-- cheap enough to call on the hot path.
create or replace function rbac.has_permission(
  p_user_id uuid,
  p_permission text,
  p_scope_type text default 'global',
  p_scope_id text default null
) returns boolean
language sql stable parallel safe as $$
  select exists (
    select 1 from rbac.effective_permissions(p_user_id, p_scope_type, p_scope_id) ep
    where ep.permission = p_permission
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Quota resolution. Separate from permissions on purpose: being allowed to
-- create a workspace and having room for another are different questions.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function rbac.quota_remaining(
  p_subject_type text,
  p_subject_id uuid,
  p_key text,
  p_used integer
) returns integer
language sql stable parallel safe as $$
  select case
    when e.limit is null then 2147483647     -- unlimited
    else greatest(e.limit - p_used, 0)
  end
  from rbac.entitlements e
  where e.subject_type = p_subject_type
    and e.subject_id = p_subject_id
    and e.key = p_key
    and (e.expires_at is null or e.expires_at > now())
  limit 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Least privilege for the application role: it can read and write identity
-- data, but cannot rewrite the audit trail.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'gatekeeper_app') then
    grant usage on schema auth, rbac, audit to gatekeeper_app;
    grant select, insert, update, delete on all tables in schema auth, rbac to gatekeeper_app;
    grant select, insert on all tables in schema audit to gatekeeper_app;
    revoke update, delete on all tables in schema audit from gatekeeper_app;
    grant execute on all functions in schema rbac to gatekeeper_app;
  end if;
end $$;
