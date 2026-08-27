import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function context(params: Promise<{ slug: string }>) {
  const { slug } = await params;
  if (!UUID.test(slug)) return null;
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  return { client, humanEntryId: slug, user };
}

async function currentLoveCount(client: Awaited<ReturnType<typeof createSupabaseServerClient>>, humanEntryId: string) {
  const { data, error } = await client.from("human_entries_public").select("love_count").eq("id", humanEntryId).maybeSingle();
  if (error || !data) return null;
  return Number(data.love_count ?? 0);
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const value = await context(params);
  if (!value) return Response.json({ error: "Human not found." }, { status: 404 });
  const loveCount = await currentLoveCount(value.client, value.humanEntryId);
  if (loveCount === null) return Response.json({ error: "Human not found." }, { status: 404 });
  if (!value.user) {
    return Response.json(
      { authenticated: false, loved: false, loveCount },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const { data, error } = await value.client
    .from("human_entry_loves")
    .select("id")
    .eq("human_entry_id", value.humanEntryId)
    .eq("user_id", value.user.id)
    .maybeSingle();
  if (error) return Response.json({ error: "Love status is unavailable." }, { status: 500 });
  return Response.json(
    { authenticated: true, loved: Boolean(data), loveCount },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const value = await context(params);
  if (!value) return Response.json({ error: "Human not found." }, { status: 404 });
  if (!value.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  const { error } = await value.client.from("human_entry_loves").insert({
    human_entry_id: value.humanEntryId,
    user_id: value.user.id,
  });
  if (error && error.code !== "23505") return Response.json({ error: "Love could not be sent." }, { status: 422 });
  return Response.json({ loved: true, loveCount: await currentLoveCount(value.client, value.humanEntryId) ?? 0 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const value = await context(params);
  if (!value) return Response.json({ error: "Human not found." }, { status: 404 });
  if (!value.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  const { error } = await value.client
    .from("human_entry_loves")
    .delete()
    .eq("human_entry_id", value.humanEntryId)
    .eq("user_id", value.user.id);
  if (error) return Response.json({ error: "Love could not be updated." }, { status: 422 });
  return Response.json({ loved: false, loveCount: await currentLoveCount(value.client, value.humanEntryId) ?? 0 });
}
