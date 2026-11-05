"use client";

import { MessageCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addOrderNote, transitionOrder } from "@/app/admin/(panel)/orders/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import type { OrderStatus } from "@/lib/domain/enums";

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: "Confirm order",
  packed: "Mark packed",
  shipped: "Mark shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Mark delivered",
  delivery_failed: "Delivery failed (NDR)",
  rto: "Returned to origin",
  return_requested: "Log return request",
  returned: "Return received",
  cancelled: "Cancel order",
};

export interface NextStep {
  to: OrderStatus;
  requiresReason: boolean;
}

export function OrderActions({
  orderId,
  status,
  steps,
  whatsapp,
}: {
  orderId: string;
  status: OrderStatus;
  steps: NextStep[];
  whatsapp: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<NextStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(input: Parameters<typeof transitionOrder>[0]) {
    start(async () => {
      const res = await transitionOrder(input);
      if (!res.ok) {
        if (dialog) setError(res.message);
        else toast({ title: "Not updated", description: res.message, variant: "destructive" });
        return;
      }
      toast({ title: "Order updated", description: res.message });
      setDialog(null);
      setError(null);
      router.refresh();
    });
  }

  function choose(step: NextStep) {
    if (step.requiresReason || step.to === "shipped" || step.to === "cancelled") {
      setError(null);
      setDialog(step);
    } else run({ orderId, to: step.to });
  }

  function submitDialog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog) return;
    const f = new FormData(event.currentTarget);
    run({
      orderId,
      to: dialog.to,
      reason: String(f.get("reason") ?? "") || undefined,
      courier: String(f.get("courier") ?? "") || undefined,
      awb: String(f.get("awb") ?? "") || undefined,
    });
  }

  // Exception paths (failed delivery, RTO, cancel, rejecting a return) are secondary buttons.
  const exception = (s: NextStep) =>
    s.to === "cancelled" ||
    s.to === "delivery_failed" ||
    s.to === "rto" ||
    (status === "return_requested" && s.to === "delivered");
  const primary = steps.filter((s) => !exception(s));
  const secondary = steps.filter((s) => !primary.includes(s));

  return (
    <div className="space-y-3">
      {status === "awaiting_cod_confirmation" && whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener"
          className="flex items-center justify-center gap-2 rounded-md border border-leaf-300 bg-leaf-50 px-3 py-2 text-sm font-medium text-leaf-900 hover:bg-leaf-100"
        >
          <MessageCircleIcon className="size-4" /> Confirm with customer on WhatsApp
        </a>
      )}
      {steps.length === 0 && (
        <p className="text-sm text-muted-foreground">This order is complete — no further steps.</p>
      )}
      <div className="flex flex-col gap-2">
        {primary.map((s) => (
          <Button key={s.to} onClick={() => choose(s)} disabled={pending}>
            {ACTION_LABEL[s.to] ?? s.to}
          </Button>
        ))}
        {secondary.map((s) => (
          <Button key={s.to} variant="outline" onClick={() => choose(s)} disabled={pending}>
            {s.to === "delivered" ? "Reject return request" : (ACTION_LABEL[s.to] ?? s.to)}
          </Button>
        ))}
      </div>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <form onSubmit={submitDialog} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {dialog?.to === "shipped"
                  ? "Ship this order"
                  : dialog?.to === "cancelled"
                    ? "Cancel this order"
                    : "Record a reason"}
              </DialogTitle>
              <DialogDescription>
                {dialog?.to === "shipped"
                  ? "The customer receives tracking details by WhatsApp and email."
                  : "The reason is kept on the order and in the audit log."}
              </DialogDescription>
            </DialogHeader>
            {dialog?.to === "shipped" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="courier">Courier</Label>
                  <Input id="courier" name="courier" required placeholder="Delhivery" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="awb">AWB number</Label>
                  <Input id="awb" name="awb" required className="font-mono" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" name="reason" required={dialog?.requiresReason} rows={3} />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={pending}
                variant={dialog?.to === "cancelled" ? "destructive" : "default"}
              >
                {pending ? "Saving…" : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        start(async () => {
          const res = await addOrderNote(
            orderId,
            String(f.get("body") ?? ""),
            f.get("visible") === "on",
          );
          if (!res.ok) {
            toast({ title: "Note not saved", description: res.message, variant: "destructive" });
            return;
          }
          form.reset();
          router.refresh();
        });
      }}
      className="space-y-2"
    >
      <Label htmlFor="note-body" className="sr-only">
        Add a note
      </Label>
      <Textarea
        id="note-body"
        name="body"
        rows={2}
        placeholder="Add a note (e.g. customer asked for evening delivery)"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" name="visible" className="size-4 accent-madder-700" /> Visible to
          customer
        </label>
        <Button size="sm" variant="outline" disabled={pending}>
          Add note
        </Button>
      </div>
    </form>
  );
}
