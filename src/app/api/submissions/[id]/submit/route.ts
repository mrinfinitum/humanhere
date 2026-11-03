import { getAuthenticatedUser } from "@/lib/auth/server";
import { publishMemberSubmission } from "@/lib/posts/publish";
import { submissionRepository } from "@/lib/submissions/repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // These cookie-authenticated mutations must originate from the app.
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "invalid_origin" }, { status: 403 });
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "invalid_submission" }, { status: 400 });
  const draft = await submissionRepository.getOwned(user.id, id);
  if (!draft || !draft.intent) return Response.json({ error: "The draft is incomplete." }, { status: 400 });
  await submissionRepository.submitOwnedDraft(user.id, id);
  // Stories go live straight away unless the automatic check holds them for staff.
  const result = await publishMemberSubmission(user.id, id);
  return Response.json(result);
}
