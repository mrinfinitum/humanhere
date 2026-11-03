import "server-only";

import { adminSql } from "@/lib/neon/admin";
import { getSiteUrl } from "@/lib/neon/env";

const SENDER = "HUMAN:HERE <hello@send.humanhere.co>";

/**
 * Emails every staff member about something that needs them: a story the
 * automatic check held, or a report. It never includes a member's email or
 * private details, only what staff need to find the item. Without a Resend
 * key (local development) it only logs.
 */
export async function alertStaff({ subject, lines, path }: { subject: string; lines: string[]; path: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`Staff alert not sent (RESEND_API_KEY is not set): ${subject}`);
    return;
  }
  const recipients = await adminSql()`select u.email from public.profiles p
    join neon_auth."user" u on u.id::text = p.id::text
    where p.role in ('admin', 'editor', 'moderator') and u."emailVerified"`;
  const link = `${getSiteUrl()}${path}`;
  const text = [...lines, "", `Open it: ${link}`, "", "You get this because you are HUMAN:HERE staff."].join("\n");
  await Promise.all(recipients.map(async ({ email }) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: SENDER, to: [String(email)], subject, text }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);
    if (!response?.ok) console.error("Staff alert failed:", response?.status ?? "network");
  }));
}
