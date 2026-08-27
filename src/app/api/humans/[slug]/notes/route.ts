import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!UUID.test(slug)) return Response.json({ error: "Human not found." }, { status: 404 });

  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });

  let body = "";
  try {
    const payload = await request.json() as { body?: unknown };
    body = typeof payload.body === "string" ? payload.body.trim() : "";
  } catch {
    return Response.json({ error: "A note is required." }, { status: 400 });
  }
  if (!body || body.length > 2000) {
    return Response.json({ error: "Your note must contain between 1 and 2,000 characters." }, { status: 400 });
  }

  const { data, error } = await client.rpc("submit_private_note", {
    p_human_entry_id: slug,
    p_body: body,
  });
  if (error) return Response.json({ error: "This note could not be submitted." }, { status: 422 });
  return Response.json({ noteId: data, status: "pending" }, { status: 201 });
}
