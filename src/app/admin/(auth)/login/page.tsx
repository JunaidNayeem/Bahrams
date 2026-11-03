import { Suspense } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Wordmark } from "@/components/brand/wordmark";
import { ZariDivider } from "@/components/brand/zari-divider";
import { noindexMetadata } from "@/lib/seo/metadata";

import { LoginForm } from "./login-form";

export const metadata = noindexMetadata("Staff sign-in", "/admin/login");

async function Form({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const next = (await searchParams).next;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}

export default function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory-200 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8 shadow-card">
        <div className="space-y-3 text-center">
          <BrandMark size={64} decorative className="mx-auto" />
          <Wordmark />
          <ZariDivider className="mx-auto w-24" />
          <h1 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Staff sign-in
          </h1>
        </div>
        <Suspense>
          <Form searchParams={searchParams} />
        </Suspense>
        {process.env.NODE_ENV === "development" && (
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Local demo accounts: <code>owner@bahramsilks.local</code> (owner) or{" "}
            <code>fulfilment@bahramsilks.local</code> (fulfilment), password{" "}
            <code>bahram-local-dev</code>.
          </p>
        )}
      </div>
    </main>
  );
}
