import { requireUser } from "@/lib/auth/server";
import { submissionRepository } from "@/lib/submissions/repository";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/share");
  const { id } = await params;
  const draft = await submissionRepository.getOwned(user.id, id);
  if (!draft || !draft.intent) return Response.json({ error: "The draft is incomplete." }, { status: 400 });
  const submitted = await submissionRepository.submitOwnedDraft(user.id, id);
  return Response.json(submitted);
}
