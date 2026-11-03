"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { Wordmark } from "@/components/brand/wordmark";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { MegaMenuItem } from "@/config/navigation";

export function MobileNav({ items }: { items: readonly MegaMenuItem[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BrandMark size={32} decorative />
            <Wordmark size="sm" layout="inline" />
            <span className="sr-only">Menu</span>
          </SheetTitle>
        </SheetHeader>
        <SheetBody>
          <Accordion type="multiple">
            {items.map((item) => (
              <AccordionItem key={item.label} value={item.label}>
                <AccordionTrigger>{item.label}</AccordionTrigger>
                <AccordionContent>
                  <SheetClose asChild>
                    <Link href={item.href} className="block py-2 font-medium">
                      Shop all {item.label.toLowerCase()}
                    </Link>
                  </SheetClose>
                  {item.groups.map((group) => (
                    <div key={group.label} className="mt-3">
                      <p className="text-eyebrow text-muted-foreground uppercase">{group.label}</p>
                      <ul className="mt-1">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <SheetClose asChild>
                              <Link href={link.href} className="block py-2">
                                {link.label}
                              </Link>
                            </SheetClose>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
