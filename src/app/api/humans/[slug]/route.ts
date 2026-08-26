import { getGlobeMockBySlug, globeMocksEnabled } from "@/lib/archive/globe-mocks";
import { getPublishedHumanBySlug } from "@/lib/archive/repository";

const PUBLIC_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!PUBLIC_SLUG.test(slug)) return Response.json({ error: "Human not found." }, { status: 404 });

  const entry = globeMocksEnabled() && slug.startsWith("globe-demo-")
    ? getGlobeMockBySlug(slug)
    : await getPublishedHumanBySlug(slug);
  if (!entry) return Response.json({ error: "Human not found." }, { status: 404 });

  return Response.json(
    { entry },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
