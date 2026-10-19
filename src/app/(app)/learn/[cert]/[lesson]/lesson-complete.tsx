"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { CheckCircle2, Loader2 } from "lucide-react";

export function LessonCompleteButton({ lessonId, initialComplete }: { lessonId: string; initialComplete: boolean }) {
  const router = useRouter();
  const [complete, setComplete] = useState(initialComplete);
  const [loading, setLoading] = useState(false);

  async function markComplete() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/academy/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId })
      });
      if (res.ok) {
        setComplete(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-success">
        <CheckCircle2 className="h-4 w-4" /> Completed
      </span>
    );
  }

  return (
    <Button onClick={markComplete} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      Mark complete
    </Button>
  );
}
