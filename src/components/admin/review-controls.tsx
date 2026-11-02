"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { moderateReview, replyToReview } from "@/app/admin/(panel)/reviews/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export function ReviewControls({ id, status, reply }: { id: string; status: string; reply: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const res = await fn();
      toast({ title: res.ok ? "Done" : "Not saved", description: res.message, variant: res.ok ? "default" : "destructive" });
      router.refresh();
    });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {status !== "approved" && (
          <Button size="sm" disabled={pending} onClick={() => run(() => moderateReview(id, "approved"))}>
            Approve
          </Button>
        )}
        {status !== "rejected" && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => moderateReview(id, "rejected"))}>
            {status === "approved" ? "Hide" : "Reject"}
          </Button>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body = String(new FormData(e.currentTarget).get("reply") ?? "");
          run(() => replyToReview(id, body));
        }}
        className="space-y-2"
      >
        <label htmlFor={`reply-${id}`} className="text-xs text-muted-foreground">
          Public reply from Bahram Silks
        </label>
        <Textarea id={`reply-${id}`} name="reply" defaultValue={reply ?? ""} rows={2} />
        <Button size="sm" variant="ghost" disabled={pending}>
          Save reply
        </Button>
      </form>
    </div>
  );
}
