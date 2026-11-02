"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;

function ToastViewport({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[100] flex max-h-dvh flex-col-reverse gap-2 p-4 outline-none sm:right-0 sm:left-auto sm:w-full sm:max-w-sm",
        className,
      )}
      {...props}
    />
  );
}

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 pr-10 shadow-overlay transition-all data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=end]:animate-out data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=move]:transition-none",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        success: "border-leaf-200 bg-leaf-50 text-leaf-800",
        destructive: "border-madder-200 bg-madder-50 text-madder-800",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type ToastVariant = NonNullable<VariantProps<typeof toastVariants>["variant"]>;

function Toast({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
}

function ToastAction({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-current/30 bg-transparent px-3 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ToastClose({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Dismiss notification"
      className={cn(
        "absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-md opacity-70 transition-opacity outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      <XIcon className="size-4" aria-hidden />
    </ToastPrimitive.Close>
  );
}

function ToastTitle({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  );
}

type ToastProps = React.ComponentProps<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastActionElement,
  type ToastProps,
  type ToastVariant,
};
