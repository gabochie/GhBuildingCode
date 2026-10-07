import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground">G</span>
      <h1 className="mt-6 text-6xl font-extrabold tracking-tight">404</h1>
      <p className="mt-3 max-w-md text-lg text-muted-foreground">
        This page does not exist — or it has moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg"><Link href="/">Back to Home</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/dashboard">Dashboard</Link></Button>
      </div>
    </main>
  );
}
