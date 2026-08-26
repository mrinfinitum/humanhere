import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error("Remote help verification requires the Supabase URL, publishable key, and service-role key.");
}

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, serviceRoleKey, options);
const anonymous = createClient(url, publishableKey, options);
const suffix = randomBytes(8).toString("hex");
const password = `${randomBytes(18).toString("base64url")}aA1!`;
const userIds = [];
let entryId;
let needId;

async function createTestUser(label) {
  const email = `humanhere-help-${label}-${suffix}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error(`Could not create ${label}`);
  userIds.push(data.user.id);
  const client = createClient(url, publishableKey, options);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { client, id: data.user.id };
}

async function run() {
  const owner = await createTestUser("owner");
  const other = await createTestUser("other");

  const { data: entry, error: entryError } = await admin.from("human_entries").insert({
    slug: `help-remote-check-${suffix}`,
    type: "story",
    source: "editorial",
    first_name: "Verification",
    display_location: "Tulsa",
    subject_user_id: owner.id,
    published: true,
    published_at: new Date().toISOString(),
  }).select("id").single();
  if (entryError) throw entryError;
  entryId = entry.id;

  const { error: profileInsertError } = await admin.from("fulfillment_profiles").insert({
    user_id: owner.id,
    legal_delivery_name: "Remote Verification",
    address_line_1: "Private test address",
    city: "Tulsa",
    state: "OK",
    preferred_delivery_mode: "address_withheld",
  });
  if (profileInsertError) throw profileInsertError;

  const { data: need, error: needInsertError } = await admin.from("human_needs").insert({
    human_entry_id: entryId,
    recipient_user_id: owner.id,
    need_type: "groceries",
    public_title: "Remote verification need",
    private_notes: "Private verification note",
    status: "draft",
  }).select("id").single();
  if (needInsertError) throw needInsertError;
  needId = need.id;

  const { data: publicProfiles, error: publicProfileError } = await anonymous.from("fulfillment_profiles").select("user_id");
  assert(publicProfileError || publicProfiles.length === 0, "Anonymous access exposed fulfillment profiles.");

  const { data: ownProfiles, error: ownProfileError } = await owner.client.from("fulfillment_profiles").select("user_id").eq("user_id", owner.id);
  if (ownProfileError) throw ownProfileError;
  assert.equal(ownProfiles.length, 1, "Owner could not read their own fulfillment profile.");

  const { data: crossProfiles, error: crossProfileError } = await other.client.from("fulfillment_profiles").select("user_id").eq("user_id", owner.id);
  if (crossProfileError) throw crossProfileError;
  assert.equal(crossProfiles.length, 0, "Another user could read a fulfillment profile.");

  const { error: verifyError } = await owner.client.from("human_needs").update({
    verification_status: "staff_verified",
    verified_at: new Date().toISOString(),
    verified_by: owner.id,
  }).eq("id", needId);
  assert(verifyError, "A recipient could self-verify a need.");

  const { error: approveError } = await owner.client.from("human_needs").update({ status: "approved" }).eq("id", needId);
  assert(approveError, "A recipient could self-approve a need.");

  const { error: disabledMutationError } = await owner.client.from("human_needs").insert({
    human_entry_id: entryId,
    recipient_user_id: owner.id,
    need_type: "school",
    public_title: "Must remain disabled",
  });
  assert(disabledMutationError, "SHOW UP disabled state accepted a recipient help mutation.");

  const { data: publicNeeds, error: publicNeedsError } = await anonymous.from("human_needs_public").select("*");
  if (publicNeedsError) throw publicNeedsError;
  assert.equal(publicNeeds.length, 0, "Disabled SHOW UP exposed a public need.");

  const { error: staffFunctionError } = await owner.client.rpc("get_fulfillment_profile_for_help", { p_user_id: owner.id });
  assert(staffFunctionError, "An ordinary user invoked staff-only fulfillment access.");

  console.log(JSON.stringify({
    remote_schema_connectivity: "passed",
    show_up_database_flag_off: "passed",
    public_fulfillment_profile_denial: "passed",
    cross_user_profile_isolation: "passed",
    self_verification_denial: "passed",
    self_approval_denial: "passed",
    disabled_public_mutation_denial: "passed",
    disabled_public_projection: "passed",
    staff_function_authorization: "passed",
  }, null, 2));
}

try {
  await run();
} finally {
  if (needId) await admin.from("human_needs").delete().eq("id", needId);
  for (const userId of userIds) await admin.from("fulfillment_profiles").delete().eq("user_id", userId);
  if (userIds.length > 0) await admin.from("sensitive_access_events").delete().in("resource_id", userIds);
  if (entryId) await admin.from("human_entries").delete().eq("id", entryId);
  for (const userId of userIds) await admin.auth.admin.deleteUser(userId);
}
