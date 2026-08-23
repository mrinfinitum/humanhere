"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SubmissionDraft } from "@/lib/submissions/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const intents = [
  ["share_story", "I want to share my story"], ["need_help", "I need help"],
  ["help_someone", "I want to help someone"], ["explore", "I just want to explore"],
] as const;
const artifacts = [["portrait", "Portrait"], ["note", "Note"], ["video", "Video"], ["audio", "Audio"], ["story", "Story without a photo"]] as const;
const helpOptions = [["share_only", "I just want to share my story"], ["prayer", "I need prayer"], ["practical_help", "I need practical help"], ["resources", "I need help finding resources"], ["contact_me", "I want someone to contact me"], ["help_someone", "I want to help someone else"]] as const;
const consentOptions = [
  ["publishStory", "HUMAN:HERE may publish my story."], ["publishMedia", "HUMAN:HERE may publish my photo/video."],
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
  const firstRender = useRef(true);
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
      setDraft(saved);
      localStorage.removeItem(`humanhere:draft:${value.id}`);
      setSaveState("saved");
    } catch {
      localStorage.setItem(`humanhere:draft:${value.id}`, JSON.stringify(value));
      setSaveState(navigator.onLine ? "error" : "offline");
    }
  }, []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const value = JSON.parse(autosavePayload) as SubmissionDraft;
    const timer = window.setTimeout(() => void save(value), 900);
    return () => window.clearTimeout(timer);
  }, [autosavePayload, save]);

  function patch(values: Partial<SubmissionDraft>) { setDraft(current => ({ ...current, ...values })); }

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
    await save(draft);
    const consentResponse = await fetch(`/api/submissions/${draft.id}/consent`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(consent) });
    if (!consentResponse.ok) { setSaveState("error"); return; }
    const response = await fetch(`/api/submissions/${draft.id}/submit`, { method: "POST" });
    if (!response.ok) { setSaveState("error"); return; }
    setComplete(true);
    router.refresh();
  }

  if (complete) return <section className="share-complete"><p className="eyebrow">Submitted privately</p><h1>Thank you for trusting us.</h1><p>A human will review what you shared. Nothing publishes automatically.</p><a href="/account">My HUMAN:HERE →</a></section>;

  return (
    <section className="share-flow" aria-labelledby="share-step-title">
      <header><span>{step} / 6</span><p aria-live="polite">{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved just now" : saveState === "offline" ? "Offline — kept on this device" : "Not saved — we’ll retry"}</p></header>
      {step === 1 && <fieldset><legend id="share-step-title">What brought you here?</legend>{intents.map(([value, label]) => <button className={draft.intent === value ? "selected" : ""} type="button" key={value} onClick={() => patch({ intent: value })}>{label}</button>)}</fieldset>}
      {step === 2 && <fieldset><legend id="share-step-title">Your face / artifact</legend><p>No filters.<br />No perfection required.<br />Just you.</p>{artifacts.map(([value, label]) => <button className={draft.artifactType === value ? "selected" : ""} type="button" key={value} onClick={() => patch({ artifactType: value })}>{label}</button>)}<label className="share-upload">Choose a private file<input type="file" accept="image/jpeg,image/png,image/webp,audio/*,video/mp4,video/quicktime,application/pdf" onChange={event => void upload(event.target.files?.[0])} /></label>{uploadState && <small role="status">{uploadState}</small>}</fieldset>}
      {step === 3 && <fieldset><legend id="share-step-title">Your identity</legend>{[["full_name", "Full name"], ["first_name", "First name only"], ["anonymous", "Anonymous"]].map(([value, label]) => <button className={draft.identityMode === value ? "selected" : ""} type="button" key={value} onClick={() => patch({ identityMode: value as SubmissionDraft["identityMode"], anonymous: value === "anonymous" })}>{label}</button>)}{draft.identityMode !== "anonymous" && <label>Name<input value={draft.publicName ?? ""} onChange={event => patch({ publicName: event.target.value })} /></label>}<label>Location <span>(optional and public only if approved)</span><input value={draft.location ?? ""} onChange={event => patch({ location: event.target.value })} /></label></fieldset>}
      {step === 4 && <fieldset><legend id="share-step-title">What are you carrying?</legend><p>What happened? What gives you hope? What do you wish people understood?</p><textarea rows={12} value={draft.story ?? ""} onChange={event => patch({ story: event.target.value })} placeholder="There is no perfect way to tell it." /></fieldset>}
      {step === 5 && <fieldset><legend id="share-step-title">What would help?</legend>{helpOptions.map(([value, label]) => <button className={draft.whatWouldHelp === value ? "selected" : ""} type="button" key={value} onClick={() => patch({ whatWouldHelp: value })}>{label}</button>)}</fieldset>}
      {step === 6 && <fieldset><legend id="share-step-title">Your consent</legend><p>Each choice is separate. Sharing a story is not permission for anything you leave unchecked.</p>{consentOptions.map(([key, label]) => <label className="consent-control" key={key}><input type="checkbox" checked={consent[key]} onChange={event => setConsent(current => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}</fieldset>}
      <footer><button type="button" onClick={() => setStep(value => Math.max(1, value - 1))} disabled={step === 1}>Back</button>{step < 6 ? <button type="button" onClick={() => setStep(value => Math.min(6, value + 1))}>Continue →</button> : <button type="button" onClick={() => void submit()}>Submit for human review →</button>}</footer>
    </section>
  );
}
