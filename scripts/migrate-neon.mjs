import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in .env.local to the target Neon database.");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query("select pg_advisory_lock(180727, 1)");
  const { rows: [prerequisites] } = await client.query(`select
    to_regprocedure('auth.user_id()') is not null as auth_ready,
    exists(select 1 from pg_roles where rolname = 'authenticated') as authenticated_ready,
    exists(select 1 from pg_roles where rolname = 'anonymous') as anonymous_ready`);
  if (!Object.values(prerequisites).every(Boolean)) throw new Error("Enable Neon Data API with Managed Better Auth before applying migrations.");
  await client.query("create schema if not exists app_migrations");
  await client.query("revoke all on schema app_migrations from public, anonymous, authenticated");
  await client.query("create table if not exists app_migrations.applied (name text primary key, sha256 text not null, applied_at timestamptz not null default now())");
  const directory = new URL("../db/migrations/", import.meta.url);
  for (const name of (await readdir(directory)).filter(f => f.endsWith(".sql")).sort()) {
    const source = await readFile(new URL(name, directory), "utf8");
    const hash = createHash("sha256").update(source).digest("hex");
    const { rows: [applied] } = await client.query("select sha256 from app_migrations.applied where name = $1", [name]);
    if (applied) {
      if (applied.sha256 !== hash) throw new Error(`Previously applied migration changed: ${name}`);
      console.log(`Already applied ${name}`);
      continue;
    }
    await client.query("begin");
    try {
      // One transaction includes both schema changes and the migration receipt.
      await client.query(source.replace(/^begin;\s*/i, "").replace(/commit;\s*$/i, ""));
      await client.query("insert into app_migrations.applied (name, sha256) values ($1, $2)", [name, hash]);
      await client.query("commit");
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} catch (error) {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
