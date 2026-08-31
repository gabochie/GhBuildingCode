"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
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
