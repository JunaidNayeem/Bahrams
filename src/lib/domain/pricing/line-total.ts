import { assertPaise, multiplyPaise, type Paise } from "../money";

/** Unit price × quantity (pieces or metres in 0.5 steps), rounded half-up to the paisa. */
export function lineTotal(unitPricePaise: Paise, quantity: number): Paise {
  assertPaise(unitPricePaise, "unitPricePaise");
  if (unitPricePaise < 0) throw new RangeError("Unit price cannot be negative");
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new RangeError(`Quantity must be positive, got ${quantity}`);
  }
  return multiplyPaise(unitPricePaise, quantity);
}
