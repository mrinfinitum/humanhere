"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { SubmissionDraft } from "@/lib/submissions/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const TOTAL_STEPS = 6;
const intents = [
  ["share_story", "I want to share my story"], ["need_help", "I need help"],
  ["help_someone", "I want to help someone"], ["explore", "I just want to explore"],
] as const;
const artifacts = [["portrait", "Portrait"], ["note", "Written note"], ["video", "Video"], ["audio", "Voice"], ["story", "Story without a photo"]] as const;
const helpOptions = [["share_only", "I just want to be seen"], ["prayer", "I need prayer"], ["practical_help", "I need practical help"], ["resources", "I need help finding resources"], ["contact_me", "I want someone to contact me"], ["help_someone", "I want to help someone else"]] as const;
const consentOptions = [
  ["publishStory", "HUMAN:HERE may publish my story."], ["publishMedia", "HUMAN:HERE may publish my photo or video."],
  ["socialReuse", "HUMAN:HERE may share my story on social media."], ["mayContact", "HUMAN:HERE may contact me."],
  ["partnerReferral", "HUMAN:HERE may connect me with a partner organization."],
] as const;

type Consent = Record<(typeof consentOptions)[number][0], boolean>;

export function ShareFlow({ initial }: { initial: SubmissionDraft }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(initial);
  const [consent, setConsent] = useState<Consent>({ publishStory: false, publishMedia: false, socialReuse: false, mayContact: false, partnerReferral: false });
  const [saveState, setSaveState] = useState<"saved" | "saving" | "offline" | "error">("saved");
  const [uploadState, setUploadState] = useState("");
  const [complete, setComplete] = useState(false);
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
    if (!allowed.includes(file.type) || file.size > 50 * 1024 * 1024) { setUploadState("Choose an approved file under 50 MB."); return; }
    setUploadState("Uploading privately…");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error();
      const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
      const path = `${user.id}/${draft.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("submission-private").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "document";
      const { error: rowError } = await supabase.from("submission_media").insert({ submission_id: draft.id, media_type: mediaType, storage_path: path, mime_type: file.type, byte_size: file.size });
      if (rowError) { await supabase.storage.from("submission-private").remove([path]); throw rowError; }
      setUploadState("Uploaded privately. Nothing is public.");
    } catch { setUploadState("Upload failed. Your draft text is still safe."); }
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    const saved = await save(draft);
    if (!saved) { setSubmitting(false); return; }
    const consentResponse = await fetch(`/api/submissions/${draft.id}/consent`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(consent) });
    if (!consentResponse.ok) { setSaveState("error"); setSubmitting(false); return; }
    const response = await fetch(`/api/submissions/${draft.id}/submit`, { method: "POST" });
    if (!response.ok) { setSaveState("error"); setSubmitting(false); return; }
    setComplete(true);
    router.refresh();
  }

  if (complete) return <section className="share-complete"><p className="eyebrow">Submitted privately</p><h1>Thank you for trusting us.</h1><p>A human will review what you shared. Nothing publishes automatically.</p><a href="/account">My HUMAN:HERE →</a></section>;

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

      {step === 5 && <fieldset ref={questionRef} tabIndex={-1}><legend id="share-step-title">What would help right now?</legend><p>This does not promise publication or assistance. It helps a real person understand what you are asking for.</p><div className="share-choices">{helpOptions.map(([value, label], index) => <Choice key={value} index={index} label={label} selected={draft.whatWouldHelp === value} onClick={() => { patch({ whatWouldHelp: value }); scheduleAdvance(6); }} />)}</div></fieldset>}

      {step === 6 && <fieldset ref={questionRef} tabIndex={-1}><legend id="share-step-title">You choose what happens next.</legend><p>Each permission is separate. Anything left unchecked remains unapproved.</p><div className="share-consent-list">{consentOptions.map(([key, label], index) => <label className="consent-control" key={key}><input type="checkbox" checked={consent[key]} onChange={event => setConsent(current => ({ ...current, [key]: event.target.checked }))} /><b>{String(index + 1).padStart(2, "0")}</b><span>{label}</span></label>)}</div></fieldset>}

      <footer>
        <button className="share-back" type="button" onClick={() => goToStep(step - 1)} disabled={step === 1}>← Back</button>
        <div>{step < TOTAL_STEPS ? <button className="share-next" type="button" onClick={() => goToStep(step + 1)} disabled={!canContinue}><span>Continue</span><b>→</b></button> : <button className="share-next" type="button" onClick={() => void submit()} disabled={submitting}><span>{submitting ? "Submitting…" : "Submit for human review"}</span><b>→</b></button>}<small>{step < TOTAL_STEPS ? "Press Enter ↵" : "Nothing publishes automatically"}</small></div>
      </footer>
    </section>
  );
}

function Choice({ index, label, selected, onClick }: { index: number; label: string; selected: boolean; onClick: () => void }) {
  return <button className={selected ? "selected" : ""} type="button" aria-pressed={selected} onClick={onClick}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><i aria-hidden="true">→</i></button>;
}
