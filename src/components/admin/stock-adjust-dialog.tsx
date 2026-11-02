"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { adjustStock } from "@/app/admin/(panel)/inventory/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const REASONS = [
  ["received", "Received from loom / supplier"],
  ["returned_restock", "Return passed QC, restock"],
  ["damaged_write_off", "Damaged — write off"],
  ["audit_correction", "Stock count correction"],
  ["transfer", "Transfer between locations"],
  ["photoshoot", "Out for photoshoot"],
] as const;

const selectCls = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm";

export function StockAdjustDialog({
  variantId,
  label,
  unit,
  locations,
}: {
  variantId: string;
  label: string;
  unit: "piece" | "metre";
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const direction = f.get("direction") === "remove" ? -1 : 1;
    start(async () => {
      const res = await adjustStock({
        variantId,
        locationId: String(f.get("locationId")),
        delta: direction * Number(f.get("quantity")),
        reason: String(f.get("reason")) as (typeof REASONS)[number][0],
        note: String(f.get("note") ?? ""),
      });
      if (!res.ok) return setError(res.message);
      toast({ title: "Stock updated", description: `${label}: ${res.message}` });
      setOpen(false);
      setError(null);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>{label}. Every change is logged with its reason.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="direction">Change</Label>
              <select id="direction" name="direction" className={selectCls}>
                <option value="add">Add</option>
                <option value="remove">Remove</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity {unit === "metre" ? "(m)" : ""}</Label>
              <Input id="quantity" name="quantity" type="number" min={unit === "metre" ? 0.5 : 1} step={unit === "metre" ? 0.5 : 1} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="locationId">Location</Label>
            <select id="locationId" name="locationId" className={selectCls}>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <select id="reason" name="reason" className={selectCls}>
              {REASONS.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" name="note" maxLength={200} placeholder="e.g. Batch from Nathnagar loom" />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
