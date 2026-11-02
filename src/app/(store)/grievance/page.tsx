import { SectionHeading } from "@/components/brand/section-heading";
import { routes } from "@/config/routes";
import { getStoreSettings } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Grievance officer",
  description:
    "Contact the Bahram Silks grievance officer. We acknowledge every complaint within 48 hours and resolve it within one month.",
  path: routes.grievance,
});

/** Required by the Consumer Protection (E-Commerce) Rules, 2020. The online form follows in a later sprint. */
export default async function GrievancePage() {
  "use cache";
  const { grievanceOfficer: officer, legalEntity } = await getStoreSettings();
  return (
    <div className="container-page max-w-3xl space-y-8 py-12">
      <SectionHeading
        as="h1"
        title="Grievance officer"
        description="If something has gone wrong with an order, a product or how we handled your data, tell us. We acknowledge every complaint within 48 hours and resolve it within one month."
      />
      <dl className="grid gap-3 rounded-md border border-border bg-card p-6 text-sm sm:grid-cols-[10rem_1fr]">
        <dt className="text-muted-foreground">Name</dt>
        <dd>{officer.name}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd>
          <a href={`mailto:${officer.email}`} className="underline">
            {officer.email}
          </a>
        </dd>
        {officer.phone && (
          <>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{officer.phone}</dd>
          </>
        )}
        {officer.hours && (
          <>
            <dt className="text-muted-foreground">Hours</dt>
            <dd>{officer.hours}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Seller</dt>
        <dd>
          {legalEntity.name}
          {legalEntity.address ? `, ${legalEntity.address}` : ""}
        </dd>
      </dl>
      <p className="text-sm text-muted-foreground">
        Please include your order number if you have one. You will receive a ticket number when we acknowledge
        your complaint.
      </p>
    </div>
  );
}
