import { apiMember } from "@/lib/auth/server";
import { LimitError, submissionRepository } from "@/lib/submissions/repository";
import type { ShareIntent } from "@/lib/submissions/types";

const intents = new Set<ShareIntent>(["share_story", "need_help", "help_someone", "explore"]);

export async function POST(request: Request) {
  const { user, response } = await apiMember();
  if (response) return response;
  const body = await request.json().catch(() => ({})) as { intent?: ShareIntent };
  try {
    const draft = await submissionRepository.createDraft(user.id, body.intent && intents.has(body.intent) ? body.intent : undefined);
    return Response.json(draft, { status: 201 });
  } catch (error) {
    if (error instanceof LimitError) return Response.json({ error: error.message }, { status: 429 });
    throw error;
  }
}
