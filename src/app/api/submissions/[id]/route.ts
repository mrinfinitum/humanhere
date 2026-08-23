import { requireUser } from "@/lib/auth/server";
import { submissionRepository } from "@/lib/submissions/repository";
import type { SubmissionDraft } from "@/lib/submissions/types";

const allowed = new Set(["intent", "artifactType", "identityMode", "publicName", "anonymous", "location", "headline", "story", "whatWouldHelp", "needCategory"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/share");
  const { id } = await params;
  const incoming = await request.json() as Record<string, unknown>;
  const patch = Object.fromEntries(Object.entries(incoming).filter(([key]) => allowed.has(key))) as Partial<SubmissionDraft>;
  if (typeof patch.story === "string" && patch.story.length > 50000) return Response.json({ error: "Story is too long." }, { status: 400 });
  const draft = await submissionRepository.updateOwnedDraft(user.id, id, patch);
  return Response.json(draft);
}
