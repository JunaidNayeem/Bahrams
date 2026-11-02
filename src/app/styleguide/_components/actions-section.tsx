import { FilterIcon, HeartIcon, MoreHorizontalIcon, ShoppingBagIcon } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { Specimen, StyleguideSection } from "./specimen";
import { ToastDemo } from "./toast-demo";

const VARIANTS = ["default", "secondary", "outline", "ghost", "link", "destructive"] as const;

export function ActionsSection() {
  return (
    <StyleguideSection id="actions" title="Actions and overlays">
      <Specimen
        title="Button"
        note="Default height 40px; icon buttons 40px square; all above the 24px minimum."
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant === "default" ? "Add to cart" : variant}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="lg">
              <ShoppingBagIcon aria-hidden /> Buy now
            </Button>
            <Button size="sm" variant="outline">
              Small
            </Button>
            <Button size="icon" variant="outline" aria-label="Add to wishlist">
              <HeartIcon aria-hidden />
            </Button>
            <Button disabled>Sold out</Button>
            <Button disabled>
              <Spinner label={null} /> Placing order
            </Button>
          </div>
        </div>
      </Specimen>
      <Specimen title="Dialog, sheet, dropdown, popover, tooltip">
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove from cart?</DialogTitle>
                <DialogDescription>
                  This saree is one of a kind. If you remove it, someone else may buy it.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Keep it</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive">Remove</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <FilterIcon aria-hidden /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filter sarees</SheetTitle>
                <SheetDescription>Narrow by fabric, colour, occasion and price.</SheetDescription>
              </SheetHeader>
              <SheetBody>
                <p className="text-sm text-muted-foreground">Filter groups go here.</p>
              </SheetBody>
              <SheetFooter>
                <Button>Show 24 sarees</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Bottom sheet</Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Delivery to 812001</SheetTitle>
                <SheetDescription>
                  Estimated delivery in 4–6 days. Cash on delivery available.
                </SheetDescription>
              </SheetHeader>
              <SheetFooter />
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Order actions">
                <MoreHorizontalIcon aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Order BS-10241</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Print invoice</DropdownMenuItem>
              <DropdownMenuItem>Mark as packed</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Cancel order</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Size guide</Button>
            </PopoverTrigger>
            <PopoverContent className="text-sm">
              Most of our sarees are 5.5 m, with a separate 0.8–1 m blouse piece.
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Wishlist">
                <HeartIcon aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Wishlist</TooltipContent>
          </Tooltip>
        </div>
      </Specimen>
      <Specimen title="Toast">
        <ToastDemo />
      </Specimen>
    </StyleguideSection>
  );
}
