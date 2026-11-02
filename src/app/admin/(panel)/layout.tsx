import { ExternalLinkIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { signOutStaff } from "@/app/admin/(auth)/login/actions";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminNavigationFor } from "@/config/navigation";
import { requireStaff } from "@/lib/auth";

export const metadata = {
  title: { template: "%s · Admin · Bahram Silks", default: "Admin · Bahram Silks" },
  robots: { index: false, follow: false },
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  catalogue_editor: "Catalogue editor",
  fulfilment: "Fulfilment",
  support: "Support",
  accountant: "Accountant",
};

/** Reads the session, so it streams inside <Suspense>; signed-out visitors are redirected. */
async function Chrome({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const groups = adminNavigationFor([staff.role]);
  return (
    <div className="flex min-h-dvh bg-ivory-100">
      <AdminSidebar groups={groups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-4 backdrop-blur">
          <AdminMobileNav groups={groups} />
          <Link href="/" target="_blank" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            View store <ExternalLinkIcon className="size-3.5" aria-hidden />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right text-sm leading-tight">
              <p className="font-medium">{staff.displayName}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[staff.role] ?? staff.role}</p>
            </div>
            <form action={signOutStaff}>
              <Button variant="ghost" size="icon" aria-label="Sign out">
                <LogOutIcon />
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh">
          <Skeleton className="hidden w-60 rounded-none lg:block" />
          <div className="flex-1 p-8">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
      }
    >
      <Chrome>{children}</Chrome>
    </Suspense>
  );
}
