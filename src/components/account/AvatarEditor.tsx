"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";

const OUTPUT = 512;
const VIEW = 240;

type Crop = { image: HTMLImageElement; url: string; zoom: number; x: number; y: number };

/** Draws the visible square of the photo to a fresh canvas, which drops EXIF data such as location. */
function render(crop: Crop) {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT;
  canvas.height = OUTPUT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  const { image, zoom, x, y } = crop;
  const base = OUTPUT / Math.min(image.naturalWidth, image.naturalHeight);
  const scale = base * zoom;
  const ratio = OUTPUT / VIEW;
  context.drawImage(image,
    OUTPUT / 2 + x * ratio - (image.naturalWidth * scale) / 2,
    OUTPUT / 2 + y * ratio - (image.naturalHeight * scale) / 2,
    image.naturalWidth * scale, image.naturalHeight * scale);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Encoding failed.")), "image/jpeg", .88));
}

export function AvatarEditor({ current, name }: { current: string | null; name: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function choose(file: File | undefined) {
    setMessage(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMessage("Choose an image file.");
    if (file.size > 25 * 1024 * 1024) return setMessage("That image is too large.");
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setCrop({ image, url, zoom: 1, x: 0, y: 0 });
    image.onerror = () => { URL.revokeObjectURL(url); setMessage("That image could not be opened."); };
    image.src = url;
  }

  function close() {
    if (crop) URL.revokeObjectURL(crop.url);
    setCrop(null);
    if (input.current) input.current.value = "";
  }

  async function send(method: "POST" | "DELETE", body?: FormData) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/account/avatar", { method, body });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Your photo could not be saved.");
      close();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your photo could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!crop) return;
    const form = new FormData();
    form.set("photo", await render(crop), "avatar.jpg");
    await send("POST", form);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !crop) return;
    const next = { x: crop.x + event.clientX - drag.current.x, y: crop.y + event.clientY - drag.current.y };
    drag.current = { x: event.clientX, y: event.clientY };
    setCrop({ ...crop, ...next });
  }

  const base = crop ? VIEW / Math.min(crop.image.naturalWidth, crop.image.naturalHeight) : 1;
  return (
    <div className="avatar-editor">
      <input ref={input} className="visually-hidden" type="file" accept="image/*" id="avatar-file" onChange={event => choose(event.target.files?.[0])} />
      <div className="avatar-editor__actions">
        <label className="ig-button" htmlFor="avatar-file">{current ? "Change photo" : "Add a photo"}</label>
        {current && <button type="button" className="ig-button" disabled={busy} onClick={() => send("DELETE")}>Remove</button>}
      </div>
      {message && <p className="settings-notice settings-notice--problem" role="alert">{message}</p>}
      {/* Rendered at the page root so the overlay covers the site header too. */}
      {crop && createPortal(
        <div className="avatar-crop" role="dialog" aria-modal="true" aria-label={`Crop the photo for ${name}`}>
          <div className="avatar-crop__panel">
            <h2>Crop your photo</h2>
            <p>Drag to position it, and use the slider to zoom.</p>
            <div className="avatar-crop__view" style={{ width: VIEW, height: VIEW }}
              onPointerDown={event => { drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL being cropped */}
              <img src={crop.url} alt="" draggable={false} style={{
                width: crop.image.naturalWidth * base * crop.zoom, height: crop.image.naturalHeight * base * crop.zoom,
                transform: `translate(calc(-50% + ${crop.x}px), calc(-50% + ${crop.y}px))`,
              }} />
            </div>
            <label className="avatar-crop__zoom">Zoom<input type="range" min="1" max="3" step="0.01" value={crop.zoom} onChange={event => setCrop({ ...crop, zoom: Number(event.target.value) })} /></label>
            <div className="avatar-editor__actions">
              <button type="button" className="ig-button" onClick={close} disabled={busy}>Cancel</button>
              <button type="button" className="ig-button ig-button--primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save photo"}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
