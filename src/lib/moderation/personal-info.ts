// A plain first check, until AI moderation exists: a story that looks like it
// contains a way to find or contact someone waits for staff instead of posting.

const PHONE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const STREET = /\b\d{1,6}\s+(?:[A-Za-z0-9.'-]+\s+){0,4}(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|place|pl|terrace|ter|circle|cir|highway|hwy|parkway|pkwy|trail|trl)\b\.?/i;

/** Returns why a story should wait for staff, or null when it can post. */
export function personalInfoReason(...texts: Array<string | null | undefined>) {
  const text = texts.filter(Boolean).join("\n");
  if (PHONE.test(text)) return "Looks like it contains a phone number";
  if (EMAIL.test(text)) return "Looks like it contains an email address";
  if (STREET.test(text)) return "Looks like it contains a street address";
  return null;
}
