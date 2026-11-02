import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { FormDemo } from "./form-demo";
import { Specimen, StyleguideSection } from "./specimen";

export function InputsSection() {
  return (
    <StyleguideSection id="inputs" title="Form controls">
      <div className="grid gap-6 lg:grid-cols-2">
        <Specimen title="Input, textarea, label">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sg-name">Full name</Label>
              <Input id="sg-name" autoComplete="name" placeholder="As on your ID" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sg-invalid">Mobile number</Label>
              <Input
                id="sg-invalid"
                type="tel"
                defaultValue="98765"
                aria-invalid
                aria-describedby="sg-invalid-error"
              />
              <p id="sg-invalid-error" className="text-sm font-medium text-destructive">
                Enter a 10-digit mobile number
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sg-disabled">Order number</Label>
              <Input id="sg-disabled" disabled defaultValue="BS-10241" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sg-gift">Gift message</Label>
              <Textarea id="sg-gift" placeholder="Printed on the card inside the saree box" />
            </div>
          </div>
        </Specimen>
        <Specimen title="Select">
          <div className="grid gap-2">
            <Label htmlFor="sg-sort">Sort by</Label>
            <Select defaultValue="newest">
              <SelectTrigger id="sg-sort" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="bestselling">Bestselling</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Specimen>
        <Specimen title="Checkbox, radio group, switch">
          <div className="grid gap-6">
            <fieldset className="grid gap-3">
              <legend className="mb-2 text-sm font-medium">Fabric</legend>
              {["Tussar", "Matka", "Ghicha"].map((fabric) => (
                <div key={fabric} className="flex items-center gap-3">
                  <Checkbox id={`sg-fabric-${fabric}`} defaultChecked={fabric === "Tussar"} />
                  <Label htmlFor={`sg-fabric-${fabric}`}>{fabric}</Label>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Checkbox id="sg-fabric-all" checked="indeterminate" />
                <Label htmlFor="sg-fabric-all">All silks (indeterminate)</Label>
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Payment</legend>
              <RadioGroup defaultValue="upi" aria-label="Payment method">
                {[
                  ["upi", "UPI"],
                  ["card", "Debit or credit card"],
                  ["cod", "Cash on delivery"],
                ].map(([value, label]) => (
                  <div key={value} className="flex items-center gap-3">
                    <RadioGroupItem id={`sg-pay-${value}`} value={value} />
                    <Label htmlFor={`sg-pay-${value}`}>{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>
            <div className="flex items-center gap-3">
              <Switch id="sg-publish" defaultChecked />
              <Label htmlFor="sg-publish">Published</Label>
            </div>
          </div>
        </Specimen>
        <Specimen title="Quantity stepper" note="Pieces step by 1; fabric by 0.5 m.">
          <div className="flex flex-wrap gap-8">
            <QuantityStepper label="Quantity" showLabel max={5} defaultValue={1} />
            <QuantityStepper
              label="Length in metres"
              showLabel
              unit="metre"
              min={1}
              max={40}
              defaultValue={2.5}
            />
            <QuantityStepper label="Quantity" showLabel max={1} disabled />
          </div>
        </Specimen>
        <Specimen title="Form (React Hook Form + Zod)" className="lg:col-span-2">
          <FormDemo />
        </Specimen>
      </div>
    </StyleguideSection>
  );
}
