import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { enabledOnlyWhenExplicitlyTrue } from "../src/lib/help/flag-value.ts";
import { toPublicHumanNeed } from "../src/lib/help/public-dto.ts";

assert.equal(enabledOnlyWhenExplicitlyTrue(undefined), false, "missing SHOW UP flag must fail closed");
assert.equal(enabledOnlyWhenExplicitlyTrue("false"), false, "false SHOW UP flag must remain disabled");
assert.equal(enabledOnlyWhenExplicitlyTrue("TRUE"), false, "malformed SHOW UP flag must remain disabled");
assert.equal(enabledOnlyWhenExplicitlyTrue("true"), true, "only explicit true may enable SHOW UP");

const privateRow = {
  id: "need-1",
  human_entry_id: "human-1",
  need_type: "groceries",
  public_title: "Groceries this week",
  public_description: "Help provide groceries this week.",
  quantity_needed: 1,
  quantity_fulfilled: 0,
  public_status: "needed",
  created_at: "2026-08-26T00:00:00.000Z",
  updated_at: "2026-08-26T00:00:00.000Z",
  fulfilled_at: null,
  recipient_user_id: "private-user",
  private_notes: "private",
  address_line_1: "private",
  phone: "private",
  internal_email: "private",
};
const dto = toPublicHumanNeed(privateRow);
for (const forbidden of ["recipient_user_id", "private_notes", "address_line_1", "phone", "internal_email", "delivery_mode", "partner_id"]) {
  assert.equal(Object.hasOwn(dto, forbidden), false, `public need DTO leaked ${forbidden}`);
}

const helpDir = new URL("../src/lib/help/", import.meta.url);
for (const file of ["config.ts", "permissions.ts", "needs.ts", "recipient-profile.ts", "consent.ts", "partners.ts", "fulfillment.ts"]) {
  const source = await readFile(new URL(file, helpDir), "utf8");
  assert.match(source, /^import "server-only";/, `${file} must remain server-only`);
}

const migration = await readFile(new URL("../supabase/migrations/202608260005_help_foundation.sql", import.meta.url), "utf8");
for (const table of ["fulfillment_profiles", "human_needs", "help_partners", "human_need_partner_assignments", "fulfillment_orders", "sensitive_access_events"]) {
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security;`), `${table} must have RLS`);
}
assert.match(migration, /insert into public\.help_feature_flags \(key, enabled\) values \('show_up_enabled', false\);/, "database SHOW UP gate must default off");
assert.match(migration, /create or replace view public\.human_needs_public/, "public-safe need projection is required");

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(path));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(path);
  }
  return files;
}

const srcRoot = new URL("../src/", import.meta.url).pathname;
for (const file of await sourceFiles(srcRoot)) {
  const source = await readFile(file, "utf8");
  if (source.includes('"use client"') || source.includes("'use client'")) {
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|supabase\/admin/, `client module imports privileged Supabase access: ${file}`);
  }
}

console.log("Help foundation verified: fail-closed flags, server-only services, RLS declarations, and PII-safe DTOs.");
