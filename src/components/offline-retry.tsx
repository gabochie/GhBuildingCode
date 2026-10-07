"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { RotateCw } from "lucide-react";

export function OfflineRetry() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      window.location.reload();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const retry = useCallback(() => {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      setOnline(false);
    }
  }, []);

  if (online) return null;

  return (
    <Button onClick={retry} size="lg" className="mt-6">
      <RotateCw className="h-4 w-4" /> Try again
    </Button>
  );
}