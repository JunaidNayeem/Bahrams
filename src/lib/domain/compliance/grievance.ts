import type { GrievanceStatus } from "../enums";
import { addHours, addIstMonths, toDate, type DateInput } from "../time";

/**
 * Consumer Protection (E-Commerce) Rules 2020, rule 4(5): the grievance officer acknowledges a
 * complaint within 48 hours and resolves it within one month of receipt.
 */
export const GRIEVANCE_ACK_HOURS = 48;
export const GRIEVANCE_RESOLUTION_MONTHS = 1;

export function grievanceDueDates(receivedAt: DateInput): { acknowledgeBy: Date; resolveBy: Date } {
  return {
    acknowledgeBy: addHours(receivedAt, GRIEVANCE_ACK_HOURS),
    resolveBy: addIstMonths(receivedAt, GRIEVANCE_RESOLUTION_MONTHS),
  };
}

/** met = done on time; late = done after the deadline; pending = not done, not yet due; overdue = not done, past due. */
export type SlaState = "met" | "late" | "pending" | "overdue";

function slaState(due: Date, doneAt: DateInput | null | undefined, now: DateInput): SlaState {
  if (doneAt != null) return toDate(doneAt).getTime() <= due.getTime() ? "met" : "late";
  return toDate(now).getTime() > due.getTime() ? "overdue" : "pending";
}

export interface GrievanceSla {
  acknowledgeBy: Date;
  resolveBy: Date;
  acknowledgement: SlaState;
  resolution: SlaState;
}

export function grievanceSla(input: {
  receivedAt: DateInput;
  acknowledgedAt?: DateInput | null;
  resolvedAt?: DateInput | null;
  now: DateInput;
}): GrievanceSla {
  const { acknowledgeBy, resolveBy } = grievanceDueDates(input.receivedAt);
  // Resolving a complaint also answers it, so a resolution counts as acknowledgement.
  const acknowledgedAt = input.acknowledgedAt ?? input.resolvedAt;
  return {
    acknowledgeBy,
    resolveBy,
    acknowledgement: slaState(acknowledgeBy, acknowledgedAt, input.now),
    resolution: slaState(resolveBy, input.resolvedAt, input.now),
  };
}

const GRIEVANCE_FLOW: Readonly<Record<GrievanceStatus, readonly GrievanceStatus[]>> = {
  received: ["acknowledged", "resolved"],
  acknowledged: ["in_progress", "resolved"],
  in_progress: ["resolved"],
  resolved: [],
};

export function canAdvanceGrievance(from: GrievanceStatus, to: GrievanceStatus): boolean {
  return GRIEVANCE_FLOW[from].includes(to);
}
