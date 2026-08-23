export type HumanCursor = { publishedAt: string; id: string };

export function encodeHumanCursor(cursor: HumanCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeHumanCursor(value?: string): HumanCursor | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<HumanCursor>;
    if (typeof parsed.publishedAt !== "string" || typeof parsed.id !== "string") return undefined;
    return { publishedAt: parsed.publishedAt, id: parsed.id };
  } catch {
    return undefined;
  }
}
