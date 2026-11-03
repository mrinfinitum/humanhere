"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const REASONS = [
  ["harassment", "Harassment or bullying"], ["hate", "Hate or slurs"], ["private_information", "Shares someone's private information"],
  ["sexual_content", "Sexual content"], ["violence", "Violence or threats"], ["self_harm", "Self-harm or suicide"],
  ["minor_safety", "Puts a child at risk"], ["impersonation", "Pretends to be someone else"], ["spam", "Spam or scam"], ["other", "Something else"],
] as const;

/** Lets anyone signed in flag a story for staff to review and take down. */
export function ReportStory({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function send() {
    setState("sending");
    const response = await fetch(`/api/humans/${entryId}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, details }) }).catch(() => null);
    if (response?.status === 401) { router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }
    const result = await response?.json().catch(() => null) as { error?: string } | null;
    if (response?.ok) { setState("sent"); return; }
    setMessage(result?.error ?? "Your report could not be sent. Please try again.");
    setState("error");
  }

  if (state === "sent") return <p className="story-report story-report--sent" role="status">Thanks. Our team will look at this story.</p>;
  if (!open) return <div className="story-report"><button type="button" onClick={() => setOpen(true)}>Report this story</button></div>;
  return (
    <form className="story-report story-report--open" onSubmit={event => { event.preventDefault(); void send(); }}>
      <fieldset>
        <legend>What is wrong with this story?</legend>
        {REASONS.map(([value, label]) => <label key={value}><input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} />{label}</label>)}
      </fieldset>
      <label className="story-report-details">Anything else? <small>Optional</small><textarea rows={3} maxLength={1000} value={details} onChange={event => setDetails(event.target.value)} /></label>
      {state === "error" && <p role="alert">{message}</p>}
      <div><button type="submit" disabled={!reason || state === "sending"}>{state === "sending" ? "Sending…" : "Send report"}</button><button type="button" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  );
}
