import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import type { OrderStatus, PaymentStatus, PublishStatus } from "@/lib/domain/enums";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 space-y-2">
      {back && (
        <Link href={back.href} className="text-sm text-muted-foreground hover:text-foreground">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  tone?: "default" | "warning";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        {Icon && <Icon className={cn("size-4", tone === "warning" ? "text-warning" : "text-gold-text")} aria-hidden />}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums lining-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const cls = cn(
    "block rounded-lg border bg-card p-5",
    tone === "warning" ? "border-warning/50" : "border-border",
    href && "transition-colors hover:border-gold-500",
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

type Tone = "neutral" | "info" | "success" | "warning" | "danger";
const TONE: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  info: "bg-indigo-100 text-indigo-900",
  success: "bg-leaf-100 text-leaf-900",
  warning: "bg-gold-100 text-gold-900",
  danger: "bg-madder-100 text-madder-900",
};

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONE[tone])}>
      {children}
    </span>
  );
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  awaiting_cod_confirmation: "COD to confirm",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivery_failed: "Delivery failed",
  delivered: "Delivered",
  rto: "Returned to origin",
  return_requested: "Return requested",
  returned: "Returned",
  cancelled: "Cancelled",
};

const ORDER_TONE: Record<OrderStatus, Tone> = {
  pending_payment: "neutral",
  awaiting_cod_confirmation: "warning",
  confirmed: "info",
  packed: "info",
  shipped: "info",
  out_for_delivery: "info",
  delivery_failed: "danger",
  delivered: "success",
  rto: "danger",
  return_requested: "warning",
  returned: "neutral",
  cancelled: "neutral",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <Pill tone={ORDER_TONE[status]}>{ORDER_STATUS_LABELS[status]}</Pill>;
}

const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  pending: "neutral",
  authorized: "info",
  captured: "success",
  failed: "danger",
  refund_pending: "warning",
  refunded: "neutral",
  partially_refunded: "warning",
};

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return <Pill tone={PAYMENT_TONE[status]}>{status.replace(/_/g, " ")}</Pill>;
}

export function PublishStatusPill({ status }: { status: PublishStatus }) {
  const tone: Record<PublishStatus, Tone> = { draft: "neutral", scheduled: "info", published: "success", archived: "neutral" };
  return <Pill tone={tone[status]}>{status}</Pill>;
}

/** Plain, accessible table styling shared by admin list pages. */
export const tableCls = {
  table: "w-full text-sm",
  thead: "border-b border-border text-left text-xs text-muted-foreground uppercase",
  th: "px-3 py-2 font-medium whitespace-nowrap",
  tr: "border-b border-border last:border-0 hover:bg-muted/40",
  td: "px-3 py-3 align-middle",
};

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
}
