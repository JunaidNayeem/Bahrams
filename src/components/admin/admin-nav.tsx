"use client";

import {
  BadgeCheck,
  ChartColumn,
  FileText,
  FolderTree,
  Images,
  LayoutDashboard,
  MenuIcon,
  MessageSquareWarning,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  TicketPercent,
  Truck,
  Undo2,
  UserCog,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AdminNavGroup, AdminNavIcon } from "@/config/navigation";
import { adminUrls } from "@/config/routes";
import { cn } from "@/lib/utils";

const ICONS: Record<AdminNavIcon, LucideIcon> = {
  LayoutDashboard,
  Package,
  FolderTree,
  Images,
  BadgeCheck,
  Warehouse,
  ShoppingBag,
  Truck,
  Undo2,
  Users,
  Star,
  FileText,
  TicketPercent,
  ChartColumn,
  MessageSquareWarning,
  ShieldCheck,
  Settings,
  UserCog,
  ScrollText,
};

function isActive(pathname: string, href: string) {
  if (href === adminUrls.dashboard) return pathname === href;
  // /admin/settings must not stay highlighted on /admin/settings/staff.
  if (href === adminUrls.settings) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ groups, onNavigate }: { groups: AdminNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[0.7rem] font-semibold tracking-wider text-ivory-300/80 uppercase">{group.label}</p>
          <ul className="mt-1 space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active ? "bg-ivory-50/15 font-medium text-ivory-50" : "text-ivory-200 hover:bg-ivory-50/10 hover:text-ivory-50",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ groups }: { groups: AdminNavGroup[] }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 overflow-y-auto bg-charcoal-900 px-3 py-5 lg:block">
      <Link href={adminUrls.dashboard} className="mb-6 block px-3 font-display text-xl text-ivory-50">
        Bahram <span className="text-sm tracking-[0.3em] text-gold-200 uppercase">admin</span>
      </Link>
      <NavList groups={groups} />
    </aside>
  );
}

export function AdminMobileNav({ groups }: { groups: AdminNavGroup[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-charcoal-900 p-4">
        <SheetTitle className="mb-4 font-display text-ivory-50">Bahram admin</SheetTitle>
        <NavList groups={groups} />
      </SheetContent>
    </Sheet>
  );
}
