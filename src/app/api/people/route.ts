import { getSessionUser } from "@/lib/neon/server";
import { adminSql } from "@/lib/neon/admin";

export type PersonResult = {
  username: string; name: string; avatarPath: string | null; place: string | null;
  followers: number; following: boolean; self: boolean;
};

// Public profile fields only: the same name, @username, photo and city a
// profile page shows. Literal matching, so %, _ and \ are not wildcards.
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("q") ?? "";
  const query = raw.trim().replace(/^@/, "").toLowerCase().slice(0, 60);
  if (query.length < 2) return Response.json({ people: [] });
  const term = query.replace(/[\\%_]/g, match => `\\${match}`);
  const viewer = await getSessionUser();
  const rows = await adminSql()`select p.username, p.display_name, p.avatar_path, p.city, p.region,
      (select count(*)::integer from public.follows f where f.followee_id = p.id) as followers,
      ${viewer?.id ?? null}::uuid is not null and exists (select 1 from public.follows f where f.follower_id = ${viewer?.id ?? null}::uuid and f.followee_id = p.id) as following,
      p.id = ${viewer?.id ?? null}::uuid as self
    from public.profiles p
    where p.username is not null
      and (p.username like ${term} || '%' or lower(coalesce(p.display_name, '')) like '%' || ${term} || '%'
        or lower(coalesce(p.city, '')) like ${term} || '%')
    order by (p.username = ${query}) desc, (p.username like ${term} || '%') desc, followers desc, p.username
    limit 12`;
  const people: PersonResult[] = rows.map(row => ({
    username: String(row.username),
    name: String(row.display_name ?? "").trim() || `@${row.username}`,
    avatarPath: (row.avatar_path as string | null) ?? null,
    place: [row.city, row.region].map(part => String(part ?? "").trim()).filter(Boolean).join(", ") || null,
    followers: Number(row.followers ?? 0),
    following: row.following === true,
    self: row.self === true,
  }));
  return Response.json({ people, signedIn: Boolean(viewer) }, { headers: { "Cache-Control": "private, no-store" } });
}
