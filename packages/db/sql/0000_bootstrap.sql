-- Runs before the Drizzle migrations. Extensions only: the schemas themselves
-- are created by the generated migration, so creating them here too would make
-- its `CREATE SCHEMA` fail on a fresh database.
--
-- citext must exist before the migration runs, because columns are declared
-- with that type.
create extension if not exists "pgcrypto";
create extension if not exists "citext";
