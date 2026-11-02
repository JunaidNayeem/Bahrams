"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import {
  formatQuantity,
  normalizeQuantity,
  parseQuantity,
  stepQuantity,
  type QuantityStep,
} from "./quantity";

type QuantityStepperProps = {
  /** Visible or screen-reader label, e.g. "Quantity" or "Length in metres". */
  label: string;
  /** Show the label above the control; otherwise it is visually hidden. */
  showLabel?: boolean;
  unit?: "piece" | "metre";
  /** Defaults to 0.5 for metres and 1 for pieces. */
  step?: QuantityStep;
  min?: number;
  max: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Submits the value with a surrounding <form> (server actions). */
  name?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * WAI-ARIA spinbutton with − / + buttons. Arrow keys step, Home/End jump to min/max, and typed
 * values snap to the step grid on blur. Button presses are announced through a polite live
 * region because focus stays on the button rather than the value.
 */
function QuantityStepper({
  label,
  showLabel = false,
  unit = "piece",
  step = unit === "metre" ? 0.5 : 1,
  min = step,
  max,
  value: controlledValue,
  defaultValue,
  onValueChange,
  name,
  disabled = false,
  id,
  className,
}: QuantityStepperProps) {
  const bounds = { min, max, step };
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(() =>
    normalizeQuantity(defaultValue ?? min, bounds),
  );
  const value = controlledValue ?? uncontrolledValue;
  const [draft, setDraft] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");

  function commit(next: number, announce: boolean) {
    const normalized = normalizeQuantity(next, bounds);
    if (controlledValue === undefined) setUncontrolledValue(normalized);
    if (normalized !== value) onValueChange?.(normalized);
    if (announce) setAnnouncement(formatQuantity(normalized, unit));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const actions: Record<string, () => number> = {
      ArrowUp: () => stepQuantity(value, 1, bounds),
      ArrowDown: () => stepQuantity(value, -1, bounds),
      Home: () => min,
      End: () => max,
    };
    const action = actions[event.key];
    if (!action) {
      if (event.key === "Enter" && draft !== null) {
        commit(parseQuantity(draft) ?? value, false);
        setDraft(null);
      }
      return;
    }
    event.preventDefault();
    setDraft(null);
    commit(action(), false);
  }

  const atMin = value <= min;
  const atMax = value >= normalizeQuantity(max, bounds);
  const unitLabel = unit === "metre" ? "m" : null;

  return (
    <div data-slot="quantity-stepper" className={cn("grid gap-1.5", className)}>
      <label htmlFor={inputId} className={cn("text-sm font-medium", !showLabel && "sr-only")}>
        {label}
      </label>
      <div
        className={cn(
          "inline-flex h-11 w-fit items-center rounded-md border border-input bg-card shadow-card focus-within:border-ring",
          disabled && "opacity-50",
        )}
      >
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-l-md text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:text-muted-foreground"
          onClick={() => commit(stepQuantity(value, -1, bounds), true)}
          disabled={disabled || atMin}
          aria-controls={inputId}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <MinusIcon className="size-4" aria-hidden />
        </button>
        <div className="flex items-baseline justify-center gap-1 px-1">
          <input
            id={inputId}
            role="spinbutton"
            inputMode={step === 1 ? "numeric" : "decimal"}
            autoComplete="off"
            className="w-12 bg-transparent text-center text-base font-medium tabular-nums outline-none disabled:cursor-not-allowed"
            value={draft ?? String(value)}
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuetext={formatQuantity(value, unit)}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              if (draft !== null) commit(parseQuantity(draft) ?? value, false);
              setDraft(null);
            }}
            onKeyDown={onKeyDown}
          />
          {unitLabel && (
            <span className="text-sm text-muted-foreground" aria-hidden>
              {unitLabel}
            </span>
          )}
        </div>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-r-md text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:text-muted-foreground"
          onClick={() => commit(stepQuantity(value, 1, bounds), true)}
          disabled={disabled || atMax}
          aria-controls={inputId}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <PlusIcon className="size-4" aria-hidden />
        </button>
      </div>
      {name && <input type="hidden" name={name} value={value} />}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}

export { QuantityStepper, type QuantityStepperProps };
