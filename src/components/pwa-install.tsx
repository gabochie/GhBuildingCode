"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Registers the service worker on the client and reloads once when a new
 * version takes control. Renders nothing.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let reloaded = false;
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch(() => {
        /* sw.js is generated at build time — registration is a progressive enhancement */
      });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }, []);

  return null;
}

/**
 * Surface an "Install app" button when the browser fires
 * `beforeinstallprompt` (Chromium). Hidden otherwise.
 */
export function PwaInstallButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("onbeforeinstallprompt" in window)) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDismissed(false);
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    const onState = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("resize", onState);
    onState();
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("resize", onState);
    };
  }, []);

  if (installed || dismissed || !deferred) return null;

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={className}
      onClick={async () => {
        setDeferred(null);
        await deferred.prompt();
      }}
    >
      <Download className="h-3.5 w-3.5" /> Install app
    </Button>
  );
}

export default PwaInstallButton;