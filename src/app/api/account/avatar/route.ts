import { randomUUID } from "node:crypto";
import { adminSql } from "@/lib/neon/admin";
import { getSessionUser } from "@/lib/neon/server";
import { PUBLIC_BUCKET, putPublicObject, removeObjects } from "@/lib/storage/server";

const MAX_AVATAR_BYTES = 1024 * 1024;
const TYPES = { "image/jpeg": "jpg", "image/webp": "webp" } as const;

// The browser crops and re-encodes the photo before upload, which drops EXIF
// data such as GPS location. The server still checks the bytes are an image.
function detectType(bytes: Uint8Array): keyof typeof TYPES | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const text = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "image/webp";
  return null;
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
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectType(bytes);
  if (!type) return Response.json({ error: "Use a JPEG or WebP image." }, { status: 415 });

  const path = `avatars/${user.id}/${randomUUID()}.${TYPES[type]}`;
  const previous = await currentAvatar(user.id);
  await putPublicObject(path, bytes, type);
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
