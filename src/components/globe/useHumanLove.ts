"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type HumanLoveOptions = {
  humanId: string;
  slug: string;
  initialCount: number;
  fixture: boolean;
};

type LoveResponse = {
  authenticated?: boolean;
  loved?: boolean;
  loveCount?: number;
  error?: string;
};

function fixtureLoveKey(humanId: string) {
  return `humanhere:fixture-love:${humanId}`;
}

/**
 * One Love controller shared by the globe callout and story drawer.
 * Published Humans use Supabase; marked fixtures use session-only demo state.
 */
export function useHumanLove({ humanId, slug, initialCount, fixture }: HumanLoveOptions) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(fixture ? true : null);
  const [loved, setLoved] = useState(false);
  const [loveCount, setLoveCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fixture) {
      const frame = window.requestAnimationFrame(() => {
        let saved = false;
        try {
          saved = window.sessionStorage.getItem(fixtureLoveKey(humanId)) === "1";
        } catch {
          // Some privacy modes block storage. The demo counter still works for
          // the mounted interaction; it simply will not persist on reopen.
        }
        setLoved(saved);
        setLoveCount(initialCount + (saved ? 1 : 0));
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const controller = new AbortController();
    void fetch(`/api/humans/${humanId}/love`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async response => {
      const payload = await response.json() as LoveResponse;
      if (!response.ok) throw new Error(payload.error ?? "Love is temporarily unavailable.");
      setAuthenticated(Boolean(payload.authenticated));
      setLoved(Boolean(payload.loved));
      setLoveCount(Number(payload.loveCount ?? initialCount));
    }).catch(fetchError => {
      if (controller.signal.aborted) return;
      setAuthenticated(false);
      setError(fetchError instanceof Error ? fetchError.message : "Love is temporarily unavailable.");
    });

    return () => controller.abort();
  }, [fixture, humanId, initialCount]);

  const signIn = useCallback(() => {
    router.push(`/login?next=${encodeURIComponent(`/?human=${slug}`)}`);
  }, [router, slug]);

  const toggle = useCallback(async () => {
    if (pending) return;
    setError(null);

    if (fixture) {
      const next = !loved;
      try {
        window.sessionStorage.setItem(fixtureLoveKey(humanId), next ? "1" : "0");
      } catch {
        // Keep the in-memory demo responsive when session storage is blocked.
      }
      setLoved(next);
      setLoveCount(initialCount + (next ? 1 : 0));
      return;
    }

    if (!authenticated) {
      signIn();
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/humans/${humanId}/love`, {
        method: loved ? "DELETE" : "POST",
      });
      const payload = await response.json() as LoveResponse;
      if (response.status === 401) {
        signIn();
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "Love could not be updated.");
      setLoved(Boolean(payload.loved));
      setLoveCount(Number(payload.loveCount ?? loveCount));
    } catch (loveError) {
      setError(loveError instanceof Error ? loveError.message : "Love could not be updated.");
    } finally {
      setPending(false);
    }
  }, [authenticated, fixture, humanId, initialCount, loveCount, loved, pending, signIn]);

  return {
    authenticated,
    loved,
    loveCount,
    pending,
    error,
    signIn,
    toggle,
  };
}
