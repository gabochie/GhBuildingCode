"use client";

import { useCallback, useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui";

type Theme = "light" | "dark" | "system";

const LABELS: Record<Theme, string> = {
  light: "Switch to dark",
  dark: "Switch to system",
  system: "Switch to light"
};

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("ghbc-theme") as Theme | null;
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : prev === "dark" ? "system" : "light";
      localStorage.setItem("ghbc-theme", next);
      const prefersDark = matchMedia("(prefers-color-scheme:dark)").matches;
      document.documentElement.classList.toggle("dark", next === "dark" || (next === "system" && prefersDark));
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      className={className}
    >
      {theme === "light" && <Sun className="size-4" />}
      {theme === "dark" && <Moon className="size-4" />}
      {theme === "system" && <Monitor className="size-4" />}
    </Button>
  );
}
