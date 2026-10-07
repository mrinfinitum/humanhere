import { getAuthenticatedUser } from "@/lib/auth/server";
import { submissionRepository } from "@/lib/submissions/repository";
import type { SubmissionDraft } from "@/lib/submissions/types";

const allowed = new Set(["intent", "artifactType", "identityMode", "publicName", "anonymous", "location", "headline", "story", "whatWouldHelp", "needCategory"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // These cookie-authenticated mutations must originate from the app.
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "invalid_origin" }, { status: 403 });
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "invalid_submission" }, { status: 400 });
  const incoming = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!incoming || typeof incoming !== "object") return Response.json({ error: "invalid_draft" }, { status: 400 });
  const patch = Object.fromEntries(Object.entries(incoming).filter(([key]) => allowed.has(key))) as Partial<SubmissionDraft>;
  if (typeof patch.story === "string" && patch.story.length > 50000) return Response.json({ error: "Story is too long." }, { status: 400 });
  const draft = await submissionRepository.updateOwnedDraft(user.id, id, patch);
  return Response.json(draft);
}
