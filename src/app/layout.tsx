import type { Metadata, Viewport } from "next";

import { siteConfig } from "@/config/site";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_IN",
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  // ivory-100, the page background, so the mobile browser chrome blends into the page.
  themeColor: "#fbf7ee",
  colorScheme: "light",
};

// No cookies(), headers() or searchParams here: with cacheComponents the root layout must stay
// part of the static shell for every route.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={cn(fontVariables, "h-full")}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
