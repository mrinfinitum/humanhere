import { getAuthenticatedUser } from "@/lib/auth/server";
import { adminSql } from "@/lib/neon/admin";
import { createDatabaseClient } from "@/lib/neon/server";
import { countPrivateObjects, FileTypeMismatch, finalizePrivateObject, inspectPrivateObject, PRIVATE_BUCKET, removeObjects, signPrivateUpload } from "@/lib/storage/server";
import { isOwnedUploadKey, uploadMetadata } from "@/lib/storage/validation";

const MAX_FILES = 10;
const MAX_PENDING = 10;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // These cookie-authenticated mutations must originate from the app.
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "invalid_origin" }, { status: 403 });
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "invalid_submission" }, { status: 400 });
  const database = await createDatabaseClient();
  const { data: draft, error: draftError } = await database.from("submissions").select("id,status").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (draftError) return Response.json({ error: "database_unavailable" }, { status: 503 });
  if (!draft || draft.status !== "draft") return Response.json({ error: "draft_required" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const metadata = uploadMetadata(body);
  if (!metadata) return Response.json({ error: "invalid_file" }, { status: 400 });
  if (body.action === "prepare") {
    // Caps what one draft can hold, so uploads cannot fill storage or swamp cleanup.
    const [{ count: registeredCount }, pendingCount] = await Promise.all([
      database.from("submission_media").select("id", { count: "exact", head: true }).eq("submission_id", id),
      countPrivateObjects(`${user.id}/${id}/pending/`, MAX_PENDING + 1),
    ]);
    if ((registeredCount ?? 0) >= MAX_FILES || pendingCount >= MAX_PENDING) {
      return Response.json({ error: "too_many_files" }, { status: 429 });
    }
    const key = `${user.id}/${id}/pending/${crypto.randomUUID()}.${metadata.extension}`;
    const url = await signPrivateUpload(key, metadata.contentType, metadata.size);
    return Response.json({ key, url }, { headers: { "Cache-Control": "no-store" } });
  }
  if (body.action !== "complete" || !isOwnedUploadKey(body.key, user.id, id)) return Response.json({ error: "invalid_upload" }, { status: 400 });
  const key = body.key;
  // The final key derives from the server-generated pending name, so a retried
  // completion finds its earlier registration instead of duplicating the file.
  const finalKey = key.replace("/pending/", "/");
  const { data: registered, error: lookupError } = await database.from("submission_media").select("id").eq("storage_path", finalKey).maybeSingle();
  if (lookupError) return Response.json({ error: "database_unavailable" }, { status: 503 });
  if (registered) {
    await removeObjects(PRIVATE_BUCKET, [key]).catch(() => undefined);
    return Response.json({ ok: true });
  }
  const object = await inspectPrivateObject(key).catch(() => null);
  if (!object) return Response.json({ error: "upload_missing" }, { status: 404 });
  if (object.ContentLength !== metadata.size || object.ContentType !== metadata.contentType || !key.endsWith(`.${metadata.extension}`)) {
    await removeObjects(PRIVATE_BUCKET, [key]);
    return Response.json({ error: "file_mismatch" }, { status: 400 });
  }
  // Presigned URLs can be reused until expiry. Copy to a server-only key before
  // registration; completion requires a draft, so reviewed files cannot change.
  try {
    await finalizePrivateObject(key, finalKey);
  } catch (error) {
    if (!(error instanceof FileTypeMismatch)) throw error;
    await removeObjects(PRIVATE_BUCKET, [key]);
    return Response.json({ error: "file_mismatch" }, { status: 400 });
  }
  const finalized = await inspectPrivateObject(finalKey);
  if (finalized.ContentLength !== metadata.size || finalized.ContentType !== metadata.contentType) {
    await removeObjects(PRIVATE_BUCKET, [key, finalKey]);
    return Response.json({ error: "file_mismatch" }, { status: 400 });
  }
  // Only the server registers media, after the checks above. The draft and
  // ownership are rechecked in the same statement.
  const registration = await adminSql()`insert into public.submission_media (submission_id, media_type, storage_provider, storage_path, mime_type, byte_size)
    select s.id, ${metadata.mediaType}, 'neon', ${finalKey}, ${metadata.contentType}, ${metadata.size}
    from public.submissions s
    where s.id = ${id}::uuid and s.user_id = ${user.id}::uuid and s.status = 'draft'
      and (select count(*) from public.submission_media m where m.submission_id = s.id) < ${MAX_FILES}
    on conflict do nothing
    returning id`.catch(() => null);
  // An empty result with the key registered means a concurrent completion won.
  const raced = registration?.length === 0
    && (await database.from("submission_media").select("id").eq("storage_path", finalKey).maybeSingle()).data;
  if (!registration || (!registration.length && !raced)) {
    await removeObjects(PRIVATE_BUCKET, [key, finalKey]);
    return Response.json({ error: "upload_registration_failed" }, { status: 409 });
  }
  await removeObjects(PRIVATE_BUCKET, [key]).catch(() => undefined);
  return Response.json({ ok: true });
}
