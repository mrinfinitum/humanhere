/**
 * A short name for a story in lists. Stories have no required title, like a
 * post on X or Instagram: use the headline when there is one, otherwise the
 * opening words of the story itself.
 */
export function storyLabel(headline: string | null | undefined, story: string | null | undefined, max = 70) {
  const title = headline?.trim();
  if (title) return title;
  const text = (story ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "Empty draft";
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * .6 ? cut.slice(0, space) : cut).replace(/[\s,.;:!?-]+$/, "")}…`;
}
