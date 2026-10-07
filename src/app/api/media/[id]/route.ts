import { getAccountRole, getAuthenticatedUser } from "@/lib/auth/server";
import { adminSql } from "@/lib/neon/admin";
import { signPrivateRead } from "@/lib/storage/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const role = await getAccountRole(user.id);
  const staff = ["moderator", "editor", "admin"].includes(role);
  const [media] = await adminSql()`select m.storage_path from public.submission_media m
    join public.submissions s on s.id = m.submission_id
    where m.id = ${id}::uuid and (s.user_id = ${user.id}::uuid or ${staff})`;
  if (!media) return new Response(null, { status: 404 });
  return new Response(null, { status: 302, headers: {
    Location: await signPrivateRead(media.storage_path), "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer",
  } });
}
