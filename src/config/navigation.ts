/**
 * Storefront header mega-menu, footer link groups and admin sidebar. Follows the brief's
 * information architecture: every common search intent (product, fabric, occasion, price)
 * gets a crawlable landing page linked from here.
 */
import { OCCASIONS, type StaffRole } from "@/lib/domain/enums";
import {
  CATALOGUE_SECTIONS,
  FABRIC_COLLECTIONS,
  GUIDES,
  OCCASION_LABELS,
  PRICE_BANDS,
  SAREE_COLLECTIONS,
  adminUrls,
  collectionUrl,
  guideUrl,
  helpUrl,
  legalUrl,
  occasionUrl,
  priceBandUrl,
  routes,
  type GuideSlug,
} from "@/config/routes";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  label: string;
  /** Optional landing page for the group heading itself. */
  href?: string;
  links: readonly NavLink[];
}

/** A top-level header item; `groups` render as columns of its mega-menu panel. */
export interface MegaMenuItem {
  label: string;
  href: string;
  groups: readonly NavGroup[];
}

/* ------------------------------------------------------------------------------------------
 * Storefront
 * ---------------------------------------------------------------------------------------- */

const sareeFibreSlugs = new Set<string>([
  "tussar-silk",
  "matka-silk",
  "raw-silk",
  "ghicha-silk",
  "cotton-silk",
  "linen",
]);

const sareesByFabric: NavGroup = {
  label: "By fabric",
  href: routes.sarees,
  links: SAREE_COLLECTIONS.filter((c) => sareeFibreSlugs.has(c.slug)).map((c) => ({
    label: c.name,
    href: collectionUrl("sarees", c.slug),
  })),
};

const sareesFeatured: NavGroup = {
  label: "Featured",
  links: [
    { label: "Zari & bridal", href: collectionUrl("sarees", "zari-bridal") },
    { label: "New arrivals", href: collectionUrl("sarees", "new-arrivals") },
    { label: "All Bhagalpuri silk sarees", href: collectionUrl("sarees", "bhagalpuri-silk") },
  ],
};

const fabricByFibre: NavGroup = {
  label: "By the metre",
  href: routes.fabric,
  links: FABRIC_COLLECTIONS.filter((c) => c.slug !== "swatches").map((c) => ({
    label: c.name,
    href: collectionUrl("fabric", c.slug),
  })),
};

const fabricServices: NavGroup = {
  label: "For boutiques & designers",
  links: [
    { label: "Order swatches", href: collectionUrl("fabric", "swatches") },
    { label: "Bulk & boutique enquiries", href: routes.bulkEnquiries },
  ],
};

/** Stoles, suits, menswear and home: shown "as the range allows" (open question on launch mix). */
const moreToShop: NavGroup = {
  label: "More from the loom",
  links: [
    { label: CATALOGUE_SECTIONS.stole_dupatta.label, href: routes.stolesDupattas },
    { label: CATALOGUE_SECTIONS.dress_material.label, href: routes.dressMaterial },
    { label: CATALOGUE_SECTIONS.kurta_fabric.label, href: routes.kurtaFabric },
    { label: CATALOGUE_SECTIONS.home_furnishing.label, href: routes.homeFurnishing },
  ],
};

export const shopByOccasion: NavGroup = {
  label: "Shop by occasion",
  links: OCCASIONS.map((o) => ({ label: OCCASION_LABELS[o], href: occasionUrl(o) })),
};

export const shopByPrice: NavGroup = {
  label: "Shop by price",
  links: PRICE_BANDS.map((b) => ({ label: b.label, href: priceBandUrl(b.slug) })),
};

const guideLabels = Object.fromEntries(GUIDES.map((g) => [g.slug, g.navLabel])) as Record<
  GuideSlug,
  string
>;
const guideLabel = (slug: GuideSlug) => guideLabels[slug];

export const theCraft: NavGroup = {
  label: "The craft",
  links: [
    { label: "Our story", href: routes.ourStory },
    { label: "Our weavers", href: routes.weavers },
    { label: guideLabel("bhagalpur-silk-guide"), href: guideUrl("bhagalpur-silk-guide") },
    { label: guideLabel("silk-types-explained"), href: guideUrl("silk-types-explained") },
    { label: guideLabel("saree-care"), href: guideUrl("saree-care") },
    { label: "Journal", href: routes.journal },
  ],
};

export const helpLinks: NavGroup = {
  label: "Help",
  links: [
    { label: "Shipping", href: helpUrl("shipping") },
    { label: "Returns & exchanges", href: helpUrl("returns") },
    { label: "Track order", href: routes.trackOrder },
    { label: "FAQ", href: helpUrl("faq") },
    { label: "Contact & WhatsApp", href: routes.contact },
    { label: "Bulk & boutique enquiries", href: routes.bulkEnquiries },
  ],
};

/** Header mega-menu, in display order. */
export const headerNavigation: readonly MegaMenuItem[] = [
  {
    label: "Sarees",
    href: routes.sarees,
    groups: [sareesByFabric, sareesFeatured, shopByOccasion],
  },
  {
    label: "Fabric by the metre",
    href: routes.fabric,
    groups: [fabricByFibre, fabricServices],
  },
  {
    label: "Stoles, suits & home",
    href: routes.stolesDupattas,
    groups: [moreToShop],
  },
  {
    label: "Occasion",
    href: occasionUrl("festive"),
    groups: [shopByOccasion],
  },
  {
    label: "Price",
    href: priceBandUrl("3000-to-7000"),
    groups: [shopByPrice],
  },
  {
    label: "The craft",
    href: routes.ourStory,
    groups: [theCraft],
  },
];

/** Footer columns, in display order. */
export const footerNavigation: readonly NavGroup[] = [
  {
    label: "Shop",
    links: [
      { label: "Sarees", href: routes.sarees },
      { label: "Fabric by the metre", href: routes.fabric },
      ...moreToShop.links,
      { label: "New arrivals", href: collectionUrl("sarees", "new-arrivals") },
    ],
  },
  shopByOccasion,
  shopByPrice,
  {
    ...theCraft,
    links: [
      ...theCraft.links,
      {
        label: guideLabel("how-to-verify-silk-mark"),
        href: guideUrl("how-to-verify-silk-mark"),
      },
    ],
  },
  helpLinks,
];

/** Legal links required by the Consumer Protection (E-Commerce) Rules; also linked at checkout. */
export const footerLegalLinks: readonly NavLink[] = [
  { label: "Terms", href: legalUrl("terms") },
  { label: "Privacy", href: legalUrl("privacy") },
  { label: "Shipping", href: legalUrl("shipping-policy") },
  { label: "Returns & exchanges", href: legalUrl("returns-policy") },
  { label: "Cancellation", href: legalUrl("cancellation") },
  { label: "Grievance officer", href: routes.grievance },
  { label: "Contact", href: routes.contact },
];

/* ------------------------------------------------------------------------------------------
 * Admin sidebar
 * ---------------------------------------------------------------------------------------- */

/**
 * lucide-react icon export names. Kept as strings (not components) so this config can be
 * passed from a server component to a client sidebar; the sidebar maps names to icons.
 */
export type AdminNavIcon =
  | "LayoutDashboard"
  | "Package"
  | "FolderTree"
  | "Images"
  | "BadgeCheck"
  | "Warehouse"
  | "ShoppingBag"
  | "Truck"
  | "Undo2"
  | "Users"
  | "Star"
  | "FileText"
  | "TicketPercent"
  | "ChartColumn"
  | "MessageSquareWarning"
  | "ShieldCheck"
  | "Settings"
  | "UserCog"
  | "ScrollText";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: AdminNavIcon;
  /** Roles that see this item. Visibility only: every admin route must still check roles server-side. */
  roles: readonly StaffRole[];
}

export interface AdminNavGroup {
  label: string;
  items: readonly AdminNavItem[];
}

const ALL_STAFF: readonly StaffRole[] = [
  "owner",
  "manager",
  "catalogue_editor",
  "fulfilment",
  "support",
  "accountant",
];

export const adminNavigation: readonly AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: adminUrls.dashboard, icon: "LayoutDashboard", roles: ALL_STAFF },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        label: "Products",
        href: adminUrls.products,
        icon: "Package",
        roles: ["owner", "manager", "catalogue_editor"],
      },
      {
        label: "Collections",
        href: adminUrls.collections,
        icon: "FolderTree",
        roles: ["owner", "manager", "catalogue_editor"],
      },
      {
        label: "Media library",
        href: adminUrls.media,
        icon: "Images",
        roles: ["owner", "manager", "catalogue_editor"],
      },
      {
        label: "Authenticity",
        href: adminUrls.authenticity,
        icon: "BadgeCheck",
        roles: ["owner", "manager", "catalogue_editor"],
      },
      {
        label: "Inventory",
        href: adminUrls.inventory,
        icon: "Warehouse",
        roles: ["owner", "manager", "catalogue_editor", "fulfilment"],
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        label: "Orders",
        href: adminUrls.orders,
        icon: "ShoppingBag",
        roles: ["owner", "manager", "fulfilment", "support", "accountant"],
      },
      {
        label: "Shipments",
        href: adminUrls.shipments,
        icon: "Truck",
        roles: ["owner", "manager", "fulfilment"],
      },
      {
        label: "Returns & exchanges",
        href: adminUrls.returns,
        icon: "Undo2",
        roles: ["owner", "manager", "fulfilment", "support", "accountant"],
      },
      {
        label: "Customers",
        href: adminUrls.customers,
        icon: "Users",
        roles: ["owner", "manager", "support"],
      },
      {
        label: "Reviews",
        href: adminUrls.reviews,
        icon: "Star",
        roles: ["owner", "manager", "catalogue_editor", "support"],
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        label: "Content",
        href: adminUrls.content,
        icon: "FileText",
        roles: ["owner", "manager", "catalogue_editor"],
      },
      {
        label: "Promotions",
        href: adminUrls.promotions,
        icon: "TicketPercent",
        roles: ["owner", "manager"],
      },
      {
        label: "Reports",
        href: adminUrls.reports,
        icon: "ChartColumn",
        roles: ["owner", "manager", "accountant"],
      },
    ],
  },
  {
    label: "Compliance",
    items: [
      {
        label: "Grievances",
        href: adminUrls.grievances,
        icon: "MessageSquareWarning",
        roles: ["owner", "manager", "support"],
      },
      {
        label: "Privacy requests",
        href: adminUrls.privacyRequests,
        icon: "ShieldCheck",
        roles: ["owner", "manager", "support"],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        label: "Settings",
        href: adminUrls.settings,
        icon: "Settings",
        roles: ["owner", "manager"],
      },
      { label: "Staff & roles", href: adminUrls.staff, icon: "UserCog", roles: ["owner"] },
      {
        label: "Audit log",
        href: adminUrls.auditLog,
        icon: "ScrollText",
        roles: ["owner", "manager"],
      },
    ],
  },
];

/** Sidebar filtered to what a staff member with these roles may see; empty groups are dropped. */
export function adminNavigationFor(roles: readonly StaffRole[]): AdminNavGroup[] {
  return adminNavigation
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => item.roles.some((r) => roles.includes(r))),
    }))
    .filter((group) => group.items.length > 0);
}
