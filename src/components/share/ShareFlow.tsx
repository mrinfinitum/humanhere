"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { SubmissionDraft } from "@/lib/submissions/types";

const TOTAL_STEPS = 5;
const intents = [
  ["share_story", "I want to share my story"], ["need_help", "I need help"],
  ["help_someone", "I want to help someone"], ["explore", "I just want to explore"],
] as const;
const artifacts = [["portrait", "Portrait"], ["note", "Written note"], ["video", "Video"], ["audio", "Voice"], ["story", "Story without a photo"]] as const;
const helpOptions = [["share_only", "I just want to be seen"], ["prayer", "I need prayer"], ["practical_help", "I need practical help"], ["resources", "I need help finding resources"], ["contact_me", "I want someone to contact me"], ["help_someone", "I want to help someone else"]] as const;

export function ShareFlow({ initial }: { initial: SubmissionDraft }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(initial);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "offline" | "error">("saved");
  const [uploadState, setUploadState] = useState("");
  const [complete, setComplete] = useState<{ status: "published"; slug: string } | { status: "held"; reason: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstRender = useRef(true);
  const questionRef = useRef<HTMLFieldSetElement | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const autosavePayload = JSON.stringify({
    ...draft,
    createdAt: undefined,
    updatedAt: undefined,
    submittedAt: undefined,
  });

  const save = useCallback(async (value: SubmissionDraft) => {
    setSaveState("saving");
    try {
      const response = await fetch(`/api/submissions/${value.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
      if (!response.ok) throw new Error();
      const saved = await response.json() as SubmissionDraft;
      setDraft(current => ({ ...current, updatedAt: saved.updatedAt }));
      localStorage.removeItem(`humanhere:draft:${value.id}`);
      setSaveState("saved");
      return true;
    } catch {
      localStorage.setItem(`humanhere:draft:${value.id}`, JSON.stringify(value));
      setSaveState(navigator.onLine ? "error" : "offline");
      return false;
    }
  }, []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const value = JSON.parse(autosavePayload) as SubmissionDraft;
    const timer = window.setTimeout(() => void save(value), 900);
    return () => window.clearTimeout(timer);
  }, [autosavePayload, save]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const question = questionRef.current;
      const textControl = question?.querySelector<HTMLElement>("textarea, input:not([type='checkbox']):not([type='file'])");
      (textControl ?? question)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
  }, []);

  function patch(values: Partial<SubmissionDraft>) { setDraft(current => ({ ...current, ...values })); }

  function goToStep(next: number) {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setStep(Math.min(TOTAL_STEPS, Math.max(1, next)));
  }

  function scheduleAdvance(next: number) {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => goToStep(next), 210);
  }

  const canContinue = step === 1 ? Boolean(draft.intent)
    : step === 2 ? Boolean(draft.artifactType)
      : step === 3 ? Boolean(draft.identityMode && (draft.anonymous || draft.publicName?.trim()))
        : step === 4 ? Boolean(draft.story?.trim())
          : step === 5 ? Boolean(draft.whatWouldHelp)
            : true;

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" || event.shiftKey || step >= TOTAL_STEPS || !canContinue) return;
    const target = event.target as HTMLElement;
    if (target.matches("textarea, button, input[type='checkbox'], input[type='file']")) return;
    event.preventDefault();
    goToStep(step + 1);
  }

  async function upload(file?: File) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/mp4", "audio/wav", "video/mp4", "video/quicktime", "application/pdf"];
    // Safari and iOS voice memos often report legacy audio types.
    const aliases: Record<string, string> = { "audio/x-m4a": "audio/mp4", "audio/m4a": "audio/mp4", "audio/x-wav": "audio/wav", "audio/wave": "audio/wav", "audio/mp3": "audio/mpeg" };
    const contentType = aliases[file.type] ?? file.type;
    if (!allowed.includes(contentType) || file.size > 50 * 1024 * 1024) { setUploadState("Choose an approved file under 50 MB."); return; }
    setUploadState("Uploading privately…");
    try {
      const endpoint = `/api/submissions/${draft.id}/media`;
      const metadata = { contentType, size: file.size };
      const prepared = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "prepare", ...metadata }) });
      if (!prepared.ok) throw new Error();
      const { key, url } = await prepared.json() as { key: string; url: string };
      const uploaded = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
      if (!uploaded.ok) throw new Error();
      const completed = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", key, ...metadata }) });
      if (!completed.ok) throw new Error();
      setUploadState("Uploaded privately. It is public only once you share your story.");
    } catch { setUploadState("Upload failed. Your draft text is still safe."); }
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    const saved = await save(draft);
    if (!saved) { setSubmitting(false); return; }
    const consentResponse = await fetch(`/api/submissions/${draft.id}/consent`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!consentResponse.ok) { setSaveState("error"); setSubmitting(false); return; }
    const response = await fetch(`/api/submissions/${draft.id}/submit`, { method: "POST" });
    if (!response.ok) { setSaveState("error"); setSubmitting(false); return; }
    setComplete(await response.json() as NonNullable<typeof complete>);
    router.refresh();
  }

  if (complete?.status === "published") return <section className="share-complete"><p className="eyebrow">Posted</p><h1>You&rsquo;re live.</h1><p>Thank you for trusting us with your story. People can see it now, and you can edit or unpublish it from your profile any time.</p><a href={`/humans/${complete.slug}`}>See your story →</a><a href="/account">My HUMAN:HERE →</a></section>;
  if (complete) return <section className="share-complete"><p className="eyebrow">Waiting for a quick check</p><h1>Almost there.</h1><p>{complete.reason}, so our team will look before it posts, to keep you safe. You can edit it from your profile to take that detail out.</p><a href="/account">My HUMAN:HERE →</a></section>;

  const needsUpload = draft.artifactType === "portrait" || draft.artifactType === "video" || draft.artifactType === "audio";

  return (
    <section className="share-flow" aria-labelledby="share-step-title" onKeyDown={handleKeyDown}>
      <header>
        <div><span>{String(step).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")}</span><div className="share-progress" role="progressbar" aria-label="Story progress" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step}><i style={{ transform: `scaleX(${step / TOTAL_STEPS})` }} /></div></div>
        <p aria-live="polite">{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved privately" : saveState === "offline" ? "Offline — saved on this device" : "Not saved — try again"}</p>
      </header>

      {step === 1 && <fieldset ref={questionRef} tabIndex={-1}><legend id="share-step-title">What brought you here?</legend><p>Choose the answer that feels closest. You can change it later.</p><div className="share-choices">{intents.map(([value, label], index) => <Choice key={value} index={index} label={label} selected={draft.intent === value} onClick={() => { patch({ intent: value }); scheduleAdvance(2); }} />)}</div></fieldset>}

      {step === 2 && <fieldset ref={questionRef} tabIndex={-1}><legend id="share-step-title">How would you like to be seen?</legend><p>A simple phone photo, a voice note, a video, or only your words. Nothing needs to be polished.</p><div className="share-choices share-choices--compact">{artifacts.map(([value, label], index) => <Choice key={value} index={index} label={label} selected={draft.artifactType === value} onClick={() => { patch({ artifactType: value }); if (!(["portrait", "video", "audio"] as string[]).includes(value)) scheduleAdvance(3); }} />)}</div>{needsUpload && <label className="share-upload"><span>Add your file privately</span><small>Phone photos and recordings are welcome. Up to 50 MB.</small><input type="file" accept="image/jpeg,image/png,image/webp,audio/*,video/mp4,video/quicktime,application/pdf" onChange={event => void upload(event.target.files?.[0])} /></label>}{uploadState && <small className="share-upload-state" role="status">{uploadState}</small>}</fieldset>}

      {step === 3 && <fieldset ref={questionRef} tabIndex={-1}><legend id="share-step-title">How should we identify you?</legend><div className="share-choices share-choices--identity">{[["full_name", "Use my full name"], ["first_name", "Use my first name only"], ["anonymous", "Keep me anonymous"]].map(([value, label], index) => <Choice key={value} index={index} label={label} selected={draft.identityMode === value} onClick={() => patch({ identityMode: value as SubmissionDraft["identityMode"], anonymous: value === "anonymous", publicName: value === "anonymous" ? undefined : draft.publicName })} />)}</div><div className="share-fields">{draft.identityMode && draft.identityMode !== "anonymous" && <label><span>What should we call you?</span><input autoComplete="name" value={draft.publicName ?? ""} onChange={event => patch({ publicName: event.target.value })} placeholder={draft.identityMode === "first_name" ? "Your first name" : "Your name"} /></label>}<label><span>Where are you? <small>Optional</small></span><input autoComplete="address-level2" value={draft.location ?? ""} onChange={event => patch({ location: event.target.value })} placeholder="City or region" /><small>Only an approved, approximate public location is ever shown.</small></label></div></fieldset>}

      {step === 4 && <fieldset ref={questionRef} tabIndex={-1}><legend id="share-step-title">What are you carrying?</legend><p>What happened? What gives you hope? What do you wish someone understood?</p><textarea rows={8} value={draft.story ?? ""} onChange={event => patch({ story: event.target.value })} placeholder="There is no perfect way to tell it…" /></fieldset>}

      {step === 5 && <fieldset ref={questionRef} tabIndex={-1}><legend id="share-step-title">What would help right now?</legend><p>This does not promise assistance. It helps a real person understand what you are asking for.</p><div className="share-choices">{helpOptions.map(([value, label], index) => <Choice key={value} index={index} label={label} selected={draft.whatWouldHelp === value} onClick={() => patch({ whatWouldHelp: value })} />)}</div><p className="share-agreement">When you share, your story posts straight away, with any photo, video or audio you added. If it looks like it includes a phone number, email or street address, our team checks it first. {draft.whatWouldHelp && draft.whatWouldHelp !== "share_only" ? "We may contact you about what would help. " : ""}Featuring it on our social media follows <a href="/account/settings/privacy">your settings</a>. You can unpublish or delete it any time.</p></fieldset>}


      <footer>
        <button className="share-back" type="button" onClick={() => goToStep(step - 1)} disabled={step === 1}>← Back</button>
        <div>{step < TOTAL_STEPS ? <button className="share-next" type="button" onClick={() => goToStep(step + 1)} disabled={!canContinue}><span>Continue</span><b>→</b></button> : <button className="share-next" type="button" onClick={() => void submit()} disabled={submitting || !canContinue}><span>{submitting ? "Sharing…" : "Share my story"}</span><b>→</b></button>}<small>{step < TOTAL_STEPS ? "Press Enter ↵" : "Posts right away"}</small></div>
      </footer>
    </section>
  );
}

function Choice({ index, label, selected, onClick }: { index: number; label: string; selected: boolean; onClick: () => void }) {
  return <button className={selected ? "selected" : ""} type="button" aria-pressed={selected} onClick={onClick}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><i aria-hidden="true">→</i></button>;
}
