"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";

import { saveProduct, type SaveState } from "@/app/admin/(panel)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { CATALOGUE_SECTIONS } from "@/config/routes";
import { FIBRE_GROUPS, fibreLabel } from "@/lib/domain/claims";
import { OCCASIONS, PRODUCT_KINDS, PUBLISH_STATUSES, type SellUnit } from "@/lib/domain/enums";
import { slugify } from "@/lib/domain/slug";
import { cn } from "@/lib/utils";

export interface EditorVariant {
  id: string;
  sku: string;
  title: string;
  colour: string;
  colourHex: string;
  sellUnit: SellUnit;
  price: string;
  compareAt: string;
  minQty: string;
  active: boolean;
  stock: string | null;
}

export interface EditorValues {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  kind: string;
  primaryFibre: string;
  fibreWarp: string;
  fibreWeft: string;
  composition: string;
  weave: string;
  zari: string;
  description: string;
  care: string;
  occasions: string[];
  blouseIncluded: boolean;
  lengthM: string;
  blouseLengthM: string;
  widthCm: string;
  weightG: string;
  isOneOfAKind: boolean;
  madeToOrder: boolean;
  leadTimeDays: string;
  giEligible: boolean;
  weaverId: string;
  returnable: boolean;
  swatchAvailable: boolean;
  hsnCode: string;
  gstRate: string;
  silkMarkLabel: string;
  handloomMarkLabel: string;
  status: string;
  scheduledAt: string;
  seoTitle: string;
  seoDescription: string;
  noindex: boolean;
  variants: EditorVariant[];
}

const inputCls = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm";

function Field({
  label,
  name,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Check({
  name,
  label,
  defaultChecked,
  hint,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-madder-700"
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

// Grouped by classification (silk, blends, cotton and linen, man-made, metallic, yarn types).
const fibreOptions = (
  <>
    {FIBRE_GROUPS.map((g) => (
      <optgroup key={g.key} label={g.label}>
        {g.fibres.map((f) => (
          <option key={f} value={f}>
            {fibreLabel(f)}
          </option>
        ))}
      </optgroup>
    ))}
  </>
);

let rowKey = 0;

export function ProductEditor({
  initial,
  weavers,
  aside,
}: {
  initial: EditorValues;
  weavers: { id: string; name: string; locality: string | null }[];
  aside?: React.ReactNode;
}) {
  const [state, setState] = useState<SaveState>({ ok: false, message: null, errors: {} });
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(() => initial.variants.map((v) => ({ key: rowKey++, v })));
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const e = state.errors;

  // Submitting via onSubmit (not <form action>) stops React from resetting the fields when the
  // server rejects a save, so the editor's unsaved changes survive validation errors.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveProduct(state, data);
      setState(result);
      if (result.message) {
        toast({
          title: result.ok ? "Saved" : "Not saved",
          description: result.message,
          variant: result.ok ? "default" : "destructive",
        });
      }
    });
  }

  const addVariant = () =>
    setRows((r) => [
      ...r,
      {
        key: rowKey++,
        v: {
          id: "",
          sku: "",
          title: "",
          colour: "",
          colourHex: "",
          sellUnit: r[0]?.v.sellUnit ?? "piece",
          price: "",
          compareAt: "",
          minQty: "1",
          active: true,
          stock: null,
        },
      },
    ]);

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1fr_22rem]" noValidate>
      <input type="hidden" name="id" value={initial.id} />
      <div className="space-y-6">
        <Section title="Basics">
          <Field label="Title" name="title" error={e.title}>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(ev) => {
                setTitle(ev.target.value);
                if (!slugTouched) setSlug(slugify(ev.target.value));
              }}
              aria-invalid={Boolean(e.title)}
              required
            />
          </Field>
          <Field
            label="Subtitle"
            name="subtitle"
            hint="One line shown under the title, e.g. the weave or occasion."
          >
            <Input id="subtitle" name="subtitle" defaultValue={initial.subtitle} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" name="kind">
              <select id="kind" name="kind" defaultValue={initial.kind} className={inputCls}>
                {PRODUCT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {CATALOGUE_SECTIONS[k].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Main fibre"
              name="primaryFibre"
              hint="Drives the fabric filters and collections."
            >
              <select
                id="primaryFibre"
                name="primaryFibre"
                defaultValue={initial.primaryFibre}
                className={inputCls}
              >
                {fibreOptions}
              </select>
            </Field>
          </div>
          <Field
            label="Description"
            name="description"
            error={e.description}
            hint="Plain paragraphs; leave a blank line between them. Write it yourself — never paste supplier text."
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={initial.description}
              rows={7}
            />
          </Field>
          <Field label="Occasions" name="occasions">
            <div className="flex flex-wrap gap-4">
              {OCCASIONS.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm capitalize">
                  <input
                    type="checkbox"
                    name="occasions"
                    value={o}
                    defaultChecked={initial.occasions.includes(o)}
                    className="size-4 accent-madder-700"
                  />
                  {o}
                </label>
              ))}
            </div>
          </Field>
        </Section>

        <Section
          title="Fibre and make"
          description="Honest composition labels are the brand's promise: state warp and weft plainly."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Warp" name="fibreWarp">
              <select
                id="fibreWarp"
                name="fibreWarp"
                defaultValue={initial.fibreWarp}
                className={inputCls}
              >
                <option value="">Not recorded</option>
                {fibreOptions}
              </select>
            </Field>
            <Field label="Weft" name="fibreWeft">
              <select
                id="fibreWeft"
                name="fibreWeft"
                defaultValue={initial.fibreWeft}
                className={inputCls}
              >
                <option value="">Not recorded</option>
                {fibreOptions}
              </select>
            </Field>
          </div>
          <Field label="Composition (shown to customers)" name="composition" error={e.composition}>
            <Input
              id="composition"
              name="composition"
              defaultValue={initial.composition}
              placeholder="Tussar silk warp, ghicha silk weft"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Weave" name="weave">
              <Input
                id="weave"
                name="weave"
                defaultValue={initial.weave}
                placeholder="Plain, stripe, check, jacquard…"
              />
            </Field>
            <Field label="Zari" name="zari" hint="Leave empty if there is no zari.">
              <Input
                id="zari"
                name="zari"
                defaultValue={initial.zari}
                placeholder="Tested zari border"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Length (m)" name="lengthM" error={e.lengthM}>
              <Input
                id="lengthM"
                name="lengthM"
                inputMode="decimal"
                defaultValue={initial.lengthM}
              />
            </Field>
            <Field label="Blouse (m)" name="blouseLengthM" error={e.blouseLengthM}>
              <Input
                id="blouseLengthM"
                name="blouseLengthM"
                inputMode="decimal"
                defaultValue={initial.blouseLengthM}
              />
            </Field>
            <Field label="Width (cm)" name="widthCm" error={e.widthCm}>
              <Input
                id="widthCm"
                name="widthCm"
                inputMode="decimal"
                defaultValue={initial.widthCm}
              />
            </Field>
            <Field label="Weight (g)" name="weightG" error={e.weightG}>
              <Input
                id="weightG"
                name="weightG"
                inputMode="numeric"
                defaultValue={initial.weightG}
              />
            </Field>
          </div>
          <Check
            name="blouseIncluded"
            label="Blouse piece included"
            defaultChecked={initial.blouseIncluded}
          />
          <Field label="Care" name="care">
            <Textarea id="care" name="care" defaultValue={initial.care} rows={2} />
          </Field>
        </Section>

        <Section
          title="Variants and prices"
          description="Prices in rupees, GST-inclusive. Fabric is priced per metre and sold in 0.5 m steps."
        >
          {e.variants && <p className="text-sm text-destructive">{e.variants}</p>}
          <div className="space-y-4">
            {rows.map(({ key, v }, i) => {
              const err = (f: string) => e[`variants.${i}.${f}`];
              return (
                <fieldset key={key} className="rounded-md border border-border p-4">
                  <legend className="px-1 text-xs font-medium text-muted-foreground">
                    Variant {i + 1}
                  </legend>
                  <input type="hidden" name={`variants.${i}.id`} value={v.id} />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="SKU" name={`variants.${i}.sku`} error={err("sku")}>
                      <Input
                        id={`variants.${i}.sku`}
                        name={`variants.${i}.sku`}
                        defaultValue={v.sku}
                        className="font-mono uppercase"
                      />
                    </Field>
                    <Field label="Colour" name={`variants.${i}.colour`}>
                      <div className="flex gap-2">
                        <Input
                          id={`variants.${i}.colour`}
                          name={`variants.${i}.colour`}
                          defaultValue={v.colour}
                        />
                        <input
                          type="color"
                          name={`variants.${i}.colourHex`}
                          defaultValue={v.colourHex || "#c8a46a"}
                          aria-label="Swatch colour"
                          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-card p-1"
                        />
                      </div>
                    </Field>
                    <Field label="Sold by" name={`variants.${i}.sellUnit`}>
                      <select
                        id={`variants.${i}.sellUnit`}
                        name={`variants.${i}.sellUnit`}
                        defaultValue={v.sellUnit}
                        className={inputCls}
                      >
                        <option value="piece">Piece</option>
                        <option value="metre">Metre</option>
                      </select>
                    </Field>
                    <Field label="Price (₹)" name={`variants.${i}.price`} error={err("price")}>
                      <Input
                        id={`variants.${i}.price`}
                        name={`variants.${i}.price`}
                        inputMode="decimal"
                        defaultValue={v.price}
                      />
                    </Field>
                    <Field
                      label="Prior price (₹)"
                      name={`variants.${i}.compareAt`}
                      error={err("compareAt")}
                      hint="Optional. Shown struck through only if it's a real recent price."
                    >
                      <Input
                        id={`variants.${i}.compareAt`}
                        name={`variants.${i}.compareAt`}
                        inputMode="decimal"
                        defaultValue={v.compareAt}
                      />
                    </Field>
                    <Field
                      label="Minimum quantity"
                      name={`variants.${i}.minQty`}
                      error={err("minQty")}
                    >
                      <Input
                        id={`variants.${i}.minQty`}
                        name={`variants.${i}.minQty`}
                        inputMode="decimal"
                        defaultValue={v.minQty}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    {v.id ? (
                      <p className="text-xs text-muted-foreground">
                        In stock:{" "}
                        <span className="font-medium text-foreground">{v.stock ?? "0"}</span> —
                        change stock in Inventory.
                      </p>
                    ) : (
                      <Field
                        label="Opening stock"
                        name={`variants.${i}.openingStock`}
                        className="w-40"
                      >
                        <Input
                          id={`variants.${i}.openingStock`}
                          name={`variants.${i}.openingStock`}
                          inputMode="decimal"
                          placeholder="0"
                        />
                      </Field>
                    )}
                    <Check name={`variants.${i}.active`} label="Active" defaultChecked={v.active} />
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setRows((r) => r.filter((x) => x.key !== key))}
                      >
                        <Trash2Icon /> Remove
                      </Button>
                    )}
                  </div>
                </fieldset>
              );
            })}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <PlusIcon /> Add variant
          </Button>
        </Section>

        <Section
          title="Search engines"
          description="Leave blank to use the defaults from the title and keyword map."
        >
          <Field
            label="URL slug"
            name="slug"
            error={e.slug}
            hint={`/products/${slug || "…"} — changing it adds a 301 redirect from the old URL automatically.`}
          >
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(ev) => {
                setSlugTouched(true);
                setSlug(ev.target.value);
              }}
              className="font-mono"
            />
          </Field>
          <Field label="SEO title" name="seoTitle" hint="Up to 60 characters.">
            <Input id="seoTitle" name="seoTitle" defaultValue={initial.seoTitle} maxLength={70} />
          </Field>
          <Field label="Meta description" name="seoDescription" hint="Up to 155 characters.">
            <Textarea
              id="seoDescription"
              name="seoDescription"
              defaultValue={initial.seoDescription}
              maxLength={170}
              rows={2}
            />
          </Field>
          <Check
            name="noindex"
            label="Hide from search engines (noindex)"
            defaultChecked={initial.noindex}
          />
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Publishing">
          <Field label="Status" name="status">
            <select id="status" name="status" defaultValue={initial.status} className={inputCls}>
              {PUBLISH_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Publish at (if scheduled)" name="scheduledAt" error={e.scheduledAt}>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              defaultValue={initial.scheduledAt}
            />
          </Field>
        </Section>

        <Section title="Authenticity" description="Store badges render only from these records.">
          <Field
            label="Silk Mark label number"
            name="silkMarkLabel"
            error={e.silkMarkLabel}
            hint="Needed for “Pure Silk” and “Silk Mark” badges."
          >
            <Input
              id="silkMarkLabel"
              name="silkMarkLabel"
              defaultValue={initial.silkMarkLabel}
              className="font-mono uppercase"
            />
          </Field>
          <Field
            label="Handloom Mark label number"
            name="handloomMarkLabel"
            error={e.handloomMarkLabel}
            hint="Needed to describe the piece as Handloom."
          >
            <Input
              id="handloomMarkLabel"
              name="handloomMarkLabel"
              defaultValue={initial.handloomMarkLabel}
              className="font-mono uppercase"
            />
          </Field>
          <Check
            name="giEligible"
            label="Bhagalpur Silk (GI) eligible"
            defaultChecked={initial.giEligible}
            hint="Only for pieces made by the traditional process."
          />
          <Field label="Weaver" name="weaverId">
            <select
              id="weaverId"
              name="weaverId"
              defaultValue={initial.weaverId}
              className={inputCls}
            >
              <option value="">Not credited</option>
              {weavers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.locality ? ` · ${w.locality}` : ""}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Selling">
          <Check
            name="isOneOfAKind"
            label="One of a kind"
            defaultChecked={initial.isOneOfAKind}
            hint="Quantity 1; held for 15 min at checkout."
          />
          <Check name="madeToOrder" label="Made to order" defaultChecked={initial.madeToOrder} />
          <Field label="Lead time (days)" name="leadTimeDays" error={e.leadTimeDays}>
            <Input
              id="leadTimeDays"
              name="leadTimeDays"
              inputMode="numeric"
              defaultValue={initial.leadTimeDays}
            />
          </Field>
          <Check
            name="returnable"
            label="Returnable"
            defaultChecked={initial.returnable}
            hint="Untick for custom-cut fabric and final-sale items."
          />
          <Check
            name="swatchAvailable"
            label="Swatch available"
            defaultChecked={initial.swatchAvailable}
          />
        </Section>

        <Section title="Tax">
          <div className="grid grid-cols-2 gap-3">
            <Field label="HSN code" name="hsnCode" error={e.hsnCode}>
              <Input
                id="hsnCode"
                name="hsnCode"
                defaultValue={initial.hsnCode}
                inputMode="numeric"
              />
            </Field>
            <Field label="GST rate" name="gstRate" error={e.gstRate}>
              <select
                id="gstRate"
                name="gstRate"
                defaultValue={initial.gstRate}
                className={inputCls}
              >
                {[0, 5, 12, 18, 28].map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Silk sarees and fabric: HSN 5007 at 5%. Confirm stitched garments with the CA.
          </p>
        </Section>

        {aside}

        <div className="sticky bottom-4 rounded-lg border border-border bg-card p-4 shadow-card">
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? "Saving…" : initial.id ? "Save changes" : "Create product"}
          </Button>
          {state.message && !state.ok && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {state.message}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
