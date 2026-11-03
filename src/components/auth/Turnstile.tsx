"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: TurnstileApi } }

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<void> | undefined;

function loadTurnstile() {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { loading = undefined; reject(new Error("Turnstile failed to load")); };
    document.head.append(script);
  });
  return loading;
}

/** Cloudflare's human check. It adds a `cf-turnstile-response` field to the enclosing form. */
export function Turnstile({ siteKey, action }: { siteKey: string; action: string }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;
    void loadTurnstile().then(() => {
      if (cancelled || !container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, { sitekey: siteKey, action, theme: "dark", size: "flexible" });
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [siteKey, action]);
  return <div className="auth-turnstile" ref={container} />;
}
