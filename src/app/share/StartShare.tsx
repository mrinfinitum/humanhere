"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartShare() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  async function begin() {
    setStarting(true);
    setError("");
    try {
      const response = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (response.status === 401) {
        router.push("/login?next=%2Fshare");
        return;
      }
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error();
      const draft = await response.json() as { id?: unknown };
      if (typeof draft.id !== "string" || !/^[0-9a-f-]{36}$/i.test(draft.id)) throw new Error();
      router.replace(`/share?draft=${draft.id}`);
      router.refresh();
    } catch {
      setError("We could not open your private space. Please try again.");
      setStarting(false);
    }
  }
  return <><button className="share-begin" type="button" disabled={starting} onClick={() => void begin()}>{starting ? "Opening a private space…" : "Begin privately →"}</button>{error && <p className="share-error" role="alert">{error}</p>}</>;
}
