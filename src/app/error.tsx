"use client";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Try again, or go back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back to dashboard
        </a>
      </div>
      {process.env.NODE_ENV !== "production" ? (
        <p className="mt-4 max-w-xl rounded-md border border-warning/30 bg-warning/5 p-3 font-mono text-xs text-muted-foreground">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
