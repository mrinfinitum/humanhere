import { getAuthenticatedUser } from "@/lib/auth/server";
import { createDatabaseClient } from "@/lib/neon/server";
import { FileTypeMismatch, finalizePrivateObject, inspectPrivateObject, PRIVATE_BUCKET, removeObjects, signPrivateUpload } from "@/lib/storage/server";
import { isOwnedUploadKey, uploadMetadata } from "@/lib/storage/validation";

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
  const { error } = await database.from("submission_media").insert({
    submission_id: id, media_type: metadata.mediaType, storage_provider: "neon",
    storage_path: finalKey, mime_type: metadata.contentType, byte_size: metadata.size,
  });
  // A concurrent completion of the same upload already registered this key.
  if (error && error.code !== "23505") {
    await removeObjects(PRIVATE_BUCKET, [key, finalKey]);
    return Response.json({ error: "upload_registration_failed" }, { status: 409 });
  }
  await removeObjects(PRIVATE_BUCKET, [key]).catch(() => undefined);
  return Response.json({ ok: true });
}
