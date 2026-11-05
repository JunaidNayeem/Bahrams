"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createCoupon, setCouponActive } from "@/app/admin/(panel)/promotions/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";

export function CouponToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={active}
      disabled={pending}
      aria-label={active ? "Pause coupon" : "Enable coupon"}
      onCheckedChange={(v) =>
        start(async () => {
          const res = await setCouponActive(id, v);
          toast({
            title: res.ok ? "Saved" : "Not saved",
            description: res.message,
            variant: res.ok ? "default" : "destructive",
          });
          router.refresh();
        })
      }
    />
  );
}

const field = "space-y-1.5";

export function NewCouponDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("percentage");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> New coupon
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            start(async () => {
              const res = await createCoupon(data);
              if (!res.ok) return setError(res.message);
              toast({ title: "Coupon created", description: res.message });
              setOpen(false);
              setError(null);
              router.refresh();
            });
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>New coupon</DialogTitle>
            <DialogDescription>
              No fake countdowns: if a coupon ends, its real end date is shown.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                required
                className="font-mono uppercase"
                placeholder="DIWALI10"
              />
            </div>
            <div className={field}>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="percentage">Percentage off</option>
                <option value="flat">Flat ₹ off</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </div>
            {type !== "free_shipping" ? (
              <div className={field}>
                <Label htmlFor="value">
                  {type === "percentage" ? "Percent off" : "Rupees off"}
                </Label>
                <Input id="value" name="value" inputMode="decimal" required />
              </div>
            ) : (
              <input type="hidden" name="value" value="0" />
            )}
            {type === "percentage" && (
              <div className={field}>
                <Label htmlFor="maxDiscount">Max discount (₹)</Label>
                <Input id="maxDiscount" name="maxDiscount" inputMode="decimal" />
              </div>
            )}
            {type !== "percentage" && <input type="hidden" name="maxDiscount" value="" />}
            <div className={field}>
              <Label htmlFor="minOrder">Minimum order (₹)</Label>
              <Input id="minOrder" name="minOrder" inputMode="decimal" />
            </div>
            <div className={field}>
              <Label htmlFor="usageLimit">Total uses</Label>
              <Input
                id="usageLimit"
                name="usageLimit"
                inputMode="numeric"
                placeholder="Unlimited"
              />
            </div>
            <div className={field}>
              <Label htmlFor="startsAt">Starts</Label>
              <Input id="startsAt" name="startsAt" type="datetime-local" />
            </div>
            <div className={field}>
              <Label htmlFor="endsAt">Ends</Label>
              <Input id="endsAt" name="endsAt" type="datetime-local" />
            </div>
            <div className={field}>
              <Label htmlFor="perCustomer">Uses per customer</Label>
              <Input id="perCustomer" name="perCustomer" inputMode="numeric" defaultValue="1" />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" name="firstOrderOnly" className="size-4 accent-madder-700" />{" "}
              First order only
            </label>
          </div>
          <div className={field}>
            <Label htmlFor="description">Internal description</Label>
            <Input id="description" name="description" placeholder="Diwali 2026 campaign" />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
