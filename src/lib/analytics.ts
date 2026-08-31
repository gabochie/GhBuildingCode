"use client";

/**
 * Tiny conversion-tracking helper.
 *
 * Plausible custom events only fire when Plausible is configured
 * (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`) and `window.plausible` exists; otherwise
 * these are safe no-ops. Goal-based conversion tracking lives at the provider.
 */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    plausible?: (event: string, opts?: { props?: Record<string, string | number | boolean> }) => void;
  };
  if (typeof w.plausible === "function") {
    w.plausible(name, props ? { props } : undefined);
  }
}

/** Track a synthetic pageview (for client-side navigations that Plausible won't auto-catch). */
export function trackPageview() {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    plausible?: (event: string, opts?: { u?: string }) => void;
  };
  if (typeof w.plausible === "function") {
    w.plausible("pageview", { u: window.location.href });
  }
}
