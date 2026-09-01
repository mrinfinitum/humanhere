import { getAuthenticatedUser } from "@/lib/auth/server";
import { submissionRepository } from "@/lib/submissions/repository";
import type { ShareIntent } from "@/lib/submissions/types";

const intents = new Set<ShareIntent>(["share_story", "need_help", "help_someone", "explore"]);

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { intent?: ShareIntent };
  const draft = await submissionRepository.createDraft(user.id, body.intent && intents.has(body.intent) ? body.intent : undefined);
  return Response.json(draft, { status: 201 });
}
