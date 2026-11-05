import Link from "next/link";
import { Suspense } from "react";

import { ReviewControls } from "@/components/admin/review-controls";
import { formatDate, PageHeader, Pill } from "@/components/admin/ui";
import { RatingStars } from "@/components/ui/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Reviews" };

const ORDER = { pending: 0, approved: 1, rejected: 2 } as const;

async function Reviews() {
  await requireStaff("owner", "manager", "catalogue_editor", "support");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, author_name, author_city, rating, title, body, status, verified_purchase, reply_body, created_at, products ( id, title )",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  const reviews = [...data].sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-[1fr_18rem]"
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Pill
                tone={
                  r.status === "pending"
                    ? "warning"
                    : r.status === "approved"
                      ? "success"
                      : "neutral"
                }
              >
                {r.status}
              </Pill>
              <RatingStars rating={r.rating} size="sm" />
              {r.verified_purchase && <Pill tone="info">verified purchase</Pill>}
            </div>
            {r.title && <p className="font-medium">{r.title}</p>}
            <p className="text-sm">{r.body}</p>
            <p className="text-xs text-muted-foreground">
              {r.author_name}
              {r.author_city ? `, ${r.author_city}` : ""} · {formatDate(r.created_at)} ·{" "}
              {r.products && (
                <Link
                  href={adminUrls.product(r.products.id)}
                  className="underline-offset-4 hover:underline"
                >
                  {r.products.title}
                </Link>
              )}
            </p>
          </div>
          <ReviewControls id={r.id} status={r.status} reply={r.reply_body} />
        </li>
      ))}
    </ul>
  );
}

export default function ReviewsPage() {
  return (
    <>
      <PageHeader
        title="Reviews"
        description="Approve reviews before they appear on the store. Never edit a customer's words — reply instead."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Reviews />
      </Suspense>
    </>
  );
}
