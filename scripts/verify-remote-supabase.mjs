import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, a publishable key, and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, serviceRoleKey, options);
const publicClient = createClient(url, publishableKey, options);
const suffix = randomBytes(8).toString("hex");
const password = `${randomBytes(18).toString("base64url")}aA1!`;
const createdUserIds = [];
const createdObjectPaths = [];
let createdEntryId;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createTestUser(label) {
  const email = `humanhere-rls-${label}-${suffix}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error(`Could not create ${label}`);
  createdUserIds.push(data.user.id);
  const client = createClient(url, publishableKey, options);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { client, id: data.user.id };
}

async function run() {
  const one = await createTestUser("one");
  const two = await createTestUser("two");

  const { data: submission, error: submissionError } = await one.client
    .from("submissions")
    .insert({ user_id: one.id, story: "Disposable remote RLS verification record." })
    .select("id")
    .single();
  if (submissionError) throw submissionError;

  const { data: crossUserRows, error: crossUserError } = await two.client
    .from("submissions")
    .select("id")
    .eq("id", submission.id);
  if (crossUserError) throw crossUserError;
  assert(crossUserRows.length === 0, "Cross-user submission read was not isolated.");

  const { error: roleUpdateError } = await one.client.from("profiles").update({ role: "admin" }).eq("id", one.id);
  assert(roleUpdateError, "A normal user was able to request an admin role update.");
  const { data: ownProfile, error: profileError } = await one.client.from("profiles").select("role").eq("id", one.id).single();
  if (profileError) throw profileError;
  assert(ownProfile.role === "user", "Normal user role changed from user.");

  const { error: forgedConsentError } = await one.client.from("consent_records").insert({
    submission_id: submission.id,
    user_id: one.id,
    publish_story: true,
    verified_at: new Date().toISOString(),
    verified_by: one.id,
  });
  assert(forgedConsentError, "A normal user forged verified consent.");

  const privatePath = `${one.id}/${submission.id}/rls-check.png`;
  createdObjectPaths.push(["submission-private", privatePath]);
  const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const { error: uploadError } = await one.client.storage.from("submission-private").upload(privatePath, pngBytes, { contentType: "image/png" });
  if (uploadError) throw uploadError;
  const { error: ownerDownloadError } = await one.client.storage.from("submission-private").download(privatePath);
  assert(!ownerDownloadError, "Owner could not read their private upload.");
  const { error: otherDownloadError } = await two.client.storage.from("submission-private").download(privatePath);
  assert(otherDownloadError, "Another user could read a private upload.");
  const { error: anonymousDownloadError } = await publicClient.storage.from("submission-private").download(privatePath);
  assert(anonymousDownloadError, "Anonymous user could read a private upload.");

  const { data: entry, error: entryError } = await admin.from("human_entries").insert({
    slug: `remote-rls-check-${suffix}`,
    type: "story",
    source: "editorial",
    first_name: "Verification",
    display_location: "Tulsa",
    subject_user_id: one.id,
    allow_private_notes: true,
    published: true,
    published_at: new Date().toISOString(),
  }).select("id,slug").single();
  if (entryError) throw entryError;
  createdEntryId = entry.id;

  const { error: unauthorizedPublishError } = await one.client.from("human_entries").insert({
    slug: `unauthorized-${suffix}`,
    type: "story",
    source: "editorial",
    published: true,
    published_at: new Date().toISOString(),
  });
  assert(unauthorizedPublishError, "A normal user could insert a published HumanEntry.");

  const { error: loveError } = await two.client.from("human_entry_loves").insert({ human_entry_id: entry.id, user_id: two.id });
  if (loveError) throw loveError;
  const { error: duplicateLoveError } = await two.client.from("human_entry_loves").insert({ human_entry_id: entry.id, user_id: two.id });
  assert(duplicateLoveError?.code === "23505", "Duplicate love was not rejected by the unique constraint.");
  const { data: hiddenLoveRows, error: hiddenLoveError } = await one.client.from("human_entry_loves").select("id").eq("human_entry_id", entry.id);
  if (hiddenLoveError) throw hiddenLoveError;
  assert(hiddenLoveRows.length === 0, "A recipient could see another user's love row.");

  const { data: noteId, error: noteError } = await two.client.rpc("submit_private_note", { p_human_entry_id: entry.id, p_body: "I see you." });
  if (noteError) throw noteError;
  const { error: approveError } = await admin.from("human_entry_notes").update({ moderation_status: "approved", approved_at: new Date().toISOString(), recipient_visible: true }).eq("id", noteId);
  if (approveError) throw approveError;
  const { data: rawNoteRows, error: rawNoteError } = await one.client.from("human_entry_notes").select("id,sender_user_id").eq("id", noteId);
  if (rawNoteError) throw rawNoteError;
  assert(rawNoteRows.length === 0, "Recipient could query private note base rows or sender identity.");
  const { data: deliveredNotes, error: deliveredError } = await one.client.rpc("notes_for_me", { p_limit: 10 });
  if (deliveredError) throw deliveredError;
  const delivered = deliveredNotes.find((note) => note.note_id === noteId);
  assert(delivered?.body === "I see you.", "Approved note was not delivered through the safe recipient function.");
  assert(!Object.hasOwn(delivered, "sender_user_id"), "Recipient note projection exposed sender identity.");

  const { data: publicRows, error: publicError } = await publicClient.from("human_entries_public").select("id,slug,first_name,display_location,love_count").eq("id", entry.id);
  if (publicError) throw publicError;
  assert(publicRows.length === 1 && publicRows[0].love_count === 1, "Public projection or aggregate love count failed.");

  const publicPath = `verification/${suffix}.png`;
  createdObjectPaths.push(["published-media", publicPath]);
  const { error: publicUploadError } = await admin.storage.from("published-media").upload(publicPath, pngBytes, { contentType: "image/png" });
  if (publicUploadError) throw publicUploadError;
  const { error: publicDownloadError } = await publicClient.storage.from("published-media").download(publicPath);
  assert(!publicDownloadError, "Published media was not publicly readable.");

  console.log(JSON.stringify({
    connectivity: "passed",
    cross_user_submission_isolation: "passed",
    role_escalation_protection: "passed",
    verified_consent_protection: "passed",
    private_storage_isolation: "passed",
    unauthorized_publication_protection: "passed",
    love_uniqueness_and_privacy: "passed",
    private_note_sender_privacy: "passed",
    public_projection_and_love_count: "passed",
    published_storage_read: "passed",
  }, null, 2));
}

try {
  await run();
} finally {
  for (const [bucket, path] of createdObjectPaths) await admin.storage.from(bucket).remove([path]);
  if (createdEntryId) await admin.from("human_entries").delete().eq("id", createdEntryId);
  for (const id of createdUserIds) await admin.auth.admin.deleteUser(id);
}
