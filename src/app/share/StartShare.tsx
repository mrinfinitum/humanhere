"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartShare() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  async function begin() {
    setStarting(true);
    const response = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!response.ok) { setStarting(false); return; }
    const draft = await response.json() as { id: string };
    router.replace(`/share?draft=${draft.id}`);
  }
  return <button className="share-begin" type="button" disabled={starting} onClick={() => void begin()}>{starting ? "Opening a private space…" : "Begin privately →"}</button>;
}
