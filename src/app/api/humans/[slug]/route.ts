import { getGlobeMockBySlug } from "@/lib/archive/globe-mocks";
import { getPublishedHumanBySlug } from "@/lib/archive/repository";
import { getWorldDemoHumanBySlug } from "@/lib/archive/world-demo";

const PUBLIC_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!PUBLIC_SLUG.test(slug)) return Response.json({ error: "Human not found." }, { status: 404 });

  // Globe fixtures are code-only, visibly labelled development stories. They
  // must resolve from the same source that placed them on the globe; otherwise
  // an empty Supabase archive produces clickable Humans that return a 404.
  const entry = slug.startsWith("globe-demo-")
    ? getWorldDemoHumanBySlug(slug) ?? getGlobeMockBySlug(slug)
    : await getPublishedHumanBySlug(slug);
  if (!entry) return Response.json({ error: "Human not found." }, { status: 404 });

  return Response.json(
    { entry },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
