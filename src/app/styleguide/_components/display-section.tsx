import { PackageOpenIcon } from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationNav } from "@/components/ui/pagination";
import { Price } from "@/components/ui/price";
import { RatingStars } from "@/components/ui/rating-stars";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

import { Specimen, StyleguideSection } from "./specimen";

const BADGES: { variant: NonNullable<BadgeProps["variant"]>; label: string }[] = [
  { variant: "default", label: "New" },
  { variant: "secondary", label: "Blouse included" },
  { variant: "outline", label: "Zari" },
  { variant: "gold", label: "One of a kind" },
  { variant: "success", label: "Delivered" },
  { variant: "warning", label: "Awaiting COD confirmation" },
  { variant: "info", label: "Shipped" },
  { variant: "destructive", label: "Cancelled" },
  { variant: "soft-green", label: "In stock" },
  { variant: "soft-red", label: "RTO" },
  { variant: "soft-indigo", label: "Packed" },
  { variant: "soft-neutral", label: "Draft" },
];

const ORDERS = [
  { id: "BS-10241", item: "Tussar silk saree, madder border", status: "Packed", paise: 685000 },
  { id: "BS-10240", item: "Matka silk fabric, 3.5 m", status: "Shipped", paise: 437500 },
  { id: "BS-10239", item: "Ghicha stole, natural", status: "Delivered", paise: 189000 },
] as const;

export function DisplaySection() {
  return (
    <StyleguideSection id="display" title="Data display">
      <div className="grid gap-6 lg:grid-cols-2">
        <Specimen title="Price" note="Integer paise in, ₹ with Indian grouping out.">
          <div className="grid gap-3">
            <Price pricePaise={385000} size="lg" />
            <Price pricePaise={12345600} />
            <Price pricePaise={145050} unit="metre" />
            <Price pricePaise={540000} priorPricePaise={620000} size="lg" />
            <p className="text-xs text-muted-foreground">
              The struck-through prior price renders only when the caller passes one that the
              pricing rules have validated against price history.
            </p>
          </div>
        </Specimen>
        <Specimen title="Rating stars">
          <div className="grid gap-3">
            <RatingStars rating={4.6} count={38} />
            <RatingStars rating={3.5} size="sm" />
            <RatingStars rating={5} count={1} />
          </div>
        </Specimen>
        <Specimen title="Badge" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {BADGES.map(({ variant, label }) => (
              <Badge key={variant} variant={variant}>
                {label}
              </Badge>
            ))}
          </div>
        </Specimen>
        <Specimen title="Card" className="bg-background">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Bulk and boutique orders</CardTitle>
              <CardDescription>Fabric by the metre for boutiques and designers.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              Tell us the fabric, colour and length you need and we will reply with a quote.
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/bulk-enquiries">Send an enquiry</Link>
              </Button>
            </CardFooter>
          </Card>
        </Specimen>
        <Specimen title="Tabs and accordion">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="care">Care</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="text-sm">
              Tussar warp, ghicha weft. Natural gold body with a madder-red border.
            </TabsContent>
            <TabsContent value="care" className="text-sm">
              Dry clean recommended. Store folded in muslin, away from damp.
            </TabsContent>
            <TabsContent value="shipping" className="text-sm">
              Dispatched from Bhagalpur. Enter your PIN code for a delivery estimate.
            </TabsContent>
          </Tabs>
          <Accordion type="single" collapsible className="mt-6">
            <AccordionItem value="silk-mark">
              <AccordionTrigger>How do I verify the Silk Mark label?</AccordionTrigger>
              <AccordionContent>
                Each label carries a hologram and a unique number. Enter the number on the Silk Mark
                Organisation of India website to see who it was issued to.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="gi">
              <AccordionTrigger>What does Bhagalpur Silk (GI) mean?</AccordionTrigger>
              <AccordionContent>
                Bhagalpur Silk received its Geographical Indication in 2013. We use the GI name only
                for pieces made by the traditional process.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Specimen>
        <Specimen title="Table" className="p-0 sm:p-0 lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ORDERS.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.item}</TableCell>
                  <TableCell>
                    <Badge variant="soft-indigo">{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Price pricePaise={order.paise} size="sm" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Specimen>
        <Specimen title="Breadcrumb and pagination">
          <div className="grid gap-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/sarees">Sarees</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Tussar silk</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <PaginationNav
              currentPage={4}
              totalPages={12}
              hrefForPage={(page) =>
                page === 1 ? "/sarees/tussar-silk" : `/sarees/tussar-silk?page=${page}`
              }
            />
          </div>
        </Specimen>
        <Specimen title="Skeleton, spinner, separator, visually hidden">
          <div className="grid gap-4">
            <div className="flex gap-3" aria-busy="true">
              <Skeleton className="aspect-[3/4] w-24" />
              <div className="grid flex-1 content-start gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Spinner /> Checking delivery for your PIN code
            </div>
            <p className="text-sm">
              This sentence ends with text only screen readers hear.
              <VisuallyHidden> Hello, screen reader.</VisuallyHidden>
            </p>
          </div>
        </Specimen>
        <Specimen title="Empty state" className="lg:col-span-2">
          <EmptyState
            icon={PackageOpenIcon}
            headingLevel={3}
            title="Your cart is empty"
            description="Every piece is woven in Bhagalpur and many are one of a kind. Start with our tussar sarees."
            action={
              <Button asChild>
                <Link href="/sarees/tussar-silk">Shop tussar sarees</Link>
              </Button>
            }
          />
        </Specimen>
      </div>
    </StyleguideSection>
  );
}
