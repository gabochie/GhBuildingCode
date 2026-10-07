"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui";
import type { ReactNode } from "react";

/**
 * Anchor/button that fires a conversion-goal event before navigating.
 * Usage inside server components to keep conversion tracking on CTAs.
 */
export function TrackedCta({
  href,
  event,
  props,
  children,
  className,
  onClick,
}: {
  href: string;
  event: string;
  props?: Record<string, string | number | boolean>;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackEvent(event, props);
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}

/**
 * Button-styled tracked CTA. Renders a real `<a>` (via `Button asChild`), so
 * it is valid HTML and keyboard/screen-reader friendly — never nest a
 * `<Button>` inside a `<Link>`.
 */
export function TrackedButton({
  href,
  event,
  props,
  children,
  className,
  onClick,
  variant = "default",
  size = "md",
}: {
  href: string;
  event: string;
  props?: Record<string, string | number | boolean>;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "md" | "lg" | "icon";
}) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link
        href={href}
        onClick={() => {
          trackEvent(event, props);
          onClick?.();
        }}
      >
        {children}
      </Link>
    </Button>
  );
}
