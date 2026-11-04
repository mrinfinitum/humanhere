import { createDatabaseClient, getSessionUser } from "@/lib/neon/server";

export async function POST(request: Request) {
  if (!await getSessionUser()) return Response.json({ error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { username?: unknown; follow?: unknown };
  const username = typeof body.username === "string" ? body.username.toLowerCase() : "";
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return Response.json({ error: "invalid_username" }, { status: 400 });
  const database = await createDatabaseClient();
  const { error } = await database.rpc(body.follow === false ? "unfollow_member" : "follow_member", { p_username: username });
  if (error) return Response.json({ error: "follow_failed" }, { status: 422 });
  return Response.json({ following: body.follow !== false });
}
