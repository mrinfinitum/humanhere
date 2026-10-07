import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

// A disposable PostgreSQL engine tests real grants, functions, and RLS without
// needing a cloud project. Only Neon's JWT-to-user helper is simulated here.
const db = new PGlite({ extensions: { pgcrypto } });
try {
  await db.exec(`
    create role anonymous nologin;
    create role authenticated nologin;
    create schema auth;
    create function auth.user_id() returns text language sql stable as
      $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub' $$;
    grant usage on schema auth to anonymous, authenticated;
  `);
  const migrations = new URL("../db/migrations/", import.meta.url);
  for (const file of (await readdir(migrations)).filter(f => f.endsWith(".sql")).sort()) {
    try {
      await db.exec(await readFile(new URL(file, migrations), "utf8"));
    } catch (error) {
      throw new Error(`${file}: ${error.message} (position ${error.position ?? "unknown"})`);
    }
    console.log(`Applied ${file}`);
  }
  const tests = new URL("../db/tests/", import.meta.url);
  for (const file of (await readdir(tests)).filter(f => f.endsWith(".sql")).sort()) {
    try {
      await db.exec(await readFile(new URL(file, tests), "utf8"));
    } catch (error) {
      throw new Error(`${file}: ${error.message}`, { cause: error });
    }
    console.log(`Passed ${file}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
