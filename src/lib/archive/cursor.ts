export type HumanCursor = { publishedAt: string; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}(:?\d{2})?)$/;

export function encodeHumanCursor(cursor: HumanCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeHumanCursor(value?: string): HumanCursor | undefined {
  if (!value || value.length > 200) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<HumanCursor>;
    if (typeof parsed.publishedAt !== "string" || typeof parsed.id !== "string") return undefined;
    // Both values go into a database filter, so accept only a real timestamp
    // and a UUID: nothing that could add filter clauses or bloat the cache.
    if (!UUID.test(parsed.id) || !TIMESTAMP.test(parsed.publishedAt) || Number.isNaN(Date.parse(parsed.publishedAt))) return undefined;
    return { publishedAt: parsed.publishedAt, id: parsed.id.toLowerCase() };
  } catch {
    return undefined;
  }
}
