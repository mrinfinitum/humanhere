import { randomUUID } from "node:crypto";
import { adminSql } from "@/lib/neon/admin";
import { getSessionUser } from "@/lib/neon/server";
import { PUBLIC_BUCKET, putPublicObject, removeObjects } from "@/lib/storage/server";

const MAX_AVATAR_BYTES = 1024 * 1024;
// The browser crops and re-encodes the photo before upload, which drops EXIF
// data such as GPS location. The server accepts only JPEG and strips any
// metadata again, so a photo sent straight to this route cannot keep it.
function isJpeg(bytes: Uint8Array) {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

/** Removes EXIF, XMP and IPTC segments (APP1 and APP13) and comments from a JPEG. */
function stripJpegMetadata(bytes: Uint8Array) {
  const kept: Uint8Array[] = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    // Start of scan: the rest is image data.
    if (marker === 0xda) break;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) return null;
    if (marker !== 0xe1 && marker !== 0xed && marker !== 0xfe) kept.push(bytes.subarray(offset, offset + 2 + length));
    offset += 2 + length;
  }
  if (offset + 4 > bytes.length || bytes[offset + 1] !== 0xda) return null;
  kept.push(bytes.subarray(offset));
  const output = new Uint8Array(kept.reduce((total, part) => total + part.length, 0));
  let position = 0;
  for (const part of kept) {
    output.set(part, position);
    position += part.length;
  }
  return output;
}

async function currentAvatar(userId: string) {
  const [row] = await adminSql()`select avatar_path from public.profiles where id = ${userId}::uuid`;
  return (row?.avatar_path as string | null | undefined) ?? null;
}

async function guard(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return { error: Response.json({ error: "invalid_origin" }, { status: 403 }) };
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ error: "Sign in to change your photo." }, { status: 401 }) };
  return { user };
}

export async function POST(request: Request) {
  const { user, error } = await guard(request);
  if (error) return error;
  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Choose a photo." }, { status: 400 });
  if (file.size > MAX_AVATAR_BYTES) return Response.json({ error: "That photo is too large." }, { status: 413 });
  const original = new Uint8Array(await file.arrayBuffer());
  const bytes = isJpeg(original) ? stripJpegMetadata(original) : null;
  if (!bytes) return Response.json({ error: "Use a JPEG image." }, { status: 415 });

  // Both folder and file names are random: a public photo link must not reveal the account id.
  const path = `avatars/${randomUUID()}/${randomUUID()}.jpg`;
  const previous = await currentAvatar(user.id);
  await putPublicObject(path, bytes, "image/jpeg");
  await adminSql()`update public.profiles set avatar_path = ${path} where id = ${user.id}::uuid`;
  // The new photo is saved; a failed removal of the old one only leaves a stray file.
  if (previous) await removeObjects(PUBLIC_BUCKET, [previous]).catch(() => undefined);
  return Response.json({ avatarPath: path }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { user, error } = await guard(request);
  if (error) return error;
  const previous = await currentAvatar(user.id);
  await adminSql()`update public.profiles set avatar_path = null where id = ${user.id}::uuid`;
  if (previous) await removeObjects(PUBLIC_BUCKET, [previous]).catch(() => undefined);
  return Response.json({ avatarPath: null });
}
