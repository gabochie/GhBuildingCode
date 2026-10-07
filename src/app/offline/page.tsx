import Link from "next/link";
import { Button } from "@/components/ui";
import { OfflineRetry } from "@/components/offline-retry";
import { CloudOff } from "lucide-react";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <CloudOff className="h-8 w-8" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">You&apos;re offline</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        GHBC keeps its app shell ready but needs a connection for compliance checks, projects and documents.
        Reconnect and try again.
      </p>
      <OfflineRetry />
      <Button asChild variant="ghost" size="sm" className="mt-3">
        <Link href="/">Back to Home</Link>
      </Button>
    </main>
  );
}