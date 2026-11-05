"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteProduct } from "@/app/admin/(panel)/products/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { adminUrls } from "@/config/routes";

const CONFIRM_WORD = "DELETE";

/** Permanent delete with a typed confirmation. Archiving is the reversible alternative. */
export function DeleteProductButton({
  productId,
  title,
  photoCount,
  designCount,
}: {
  productId: string;
  title: string;
  photoCount: number;
  designCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    setTyped("");
    setError(null);
  }

  function confirmDelete() {
    setError(null);
    start(async () => {
      const res = await deleteProduct(productId);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      toast({ title: "Product deleted", description: res.message });
      setOpen(false);
      router.push(adminUrls.products);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="text-destructive">
          <Trash2Icon /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this product permanently?</DialogTitle>
          <DialogDescription>
            &ldquo;{title}&rdquo; will be removed with its {designCount} design
            {designCount === 1 ? "" : "s"}, {photoCount} photo{photoCount === 1 ? "" : "s"}, prices,
            price history, stock, reviews and collection links. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          To only hide it from the store, set its status to <strong>Archived</strong> instead.
          Products that have been ordered can&rsquo;t be deleted, only archived.
        </p>
        <div className="space-y-1.5">
          <label htmlFor="confirm-delete" className="text-sm font-medium">
            Type {CONFIRM_WORD} to confirm
          </label>
          <Input
            id="confirm-delete"
            value={typed}
            autoComplete="off"
            onChange={(e) => setTyped(e.target.value)}
            disabled={pending}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || typed.trim().toUpperCase() !== CONFIRM_WORD}
            onClick={confirmDelete}
          >
            <Trash2Icon /> {pending ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
