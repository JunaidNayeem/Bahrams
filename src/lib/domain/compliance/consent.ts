import { CONSENT_PURPOSES, type ConsentPurpose } from "../enums";
import { toDate, type DateInput } from "../time";

/**
 * DPDP Act 2023 / Rules 2025: consent is asked for each purpose separately, nothing is
 * pre-ticked, and withdrawing is as easy as granting. The consent log is append-only; the
 * current state of each purpose is the latest event for it. No event means "not granted".
 */

export interface ConsentPurposeInfo {
  purpose: ConsentPurpose;
  label: string;
  description: string;
  /** Needed to deliver what the shopper asked for; still recorded, never used for marketing. */
  necessaryForService: boolean;
}

export const CONSENT_PURPOSE_INFO: Readonly<Record<ConsentPurpose, ConsentPurposeInfo>> = {
  order_processing: {
    purpose: "order_processing",
    label: "Process my orders",
    description:
      "Use my name, contact details and address to take payment, deliver my order, handle returns and send order updates.",
    necessaryForService: true,
  },
  marketing_email: {
    purpose: "marketing_email",
    label: "Email me about new collections",
    description: "New weaves from the looms, festive collections and occasional offers by email.",
    necessaryForService: false,
  },
  marketing_whatsapp: {
    purpose: "marketing_whatsapp",
    label: "Message me on WhatsApp",
    description:
      "New arrivals and festive collections on WhatsApp. Order updates are sent separately.",
    necessaryForService: false,
  },
  marketing_sms: {
    purpose: "marketing_sms",
    label: "Send me offers by SMS",
    description: "Occasional sale and new-collection alerts by SMS.",
    necessaryForService: false,
  },
  analytics: {
    purpose: "analytics",
    label: "Help improve the website",
    description:
      "Measure how the site is used, such as pages visited, so we can make it faster and easier.",
    necessaryForService: false,
  },
};

export const MARKETING_CONSENT_PURPOSES: readonly ConsentPurpose[] = [
  "marketing_email",
  "marketing_whatsapp",
  "marketing_sms",
];

/** One row of the append-only consent log. */
export interface ConsentEvent {
  purpose: ConsentPurpose;
  granted: boolean;
  at: DateInput;
  /** Version of the privacy notice shown when the choice was made. */
  noticeVersion: string;
  /** Where it happened, e.g. "checkout", "account_privacy", "footer_banner". */
  source?: string;
}

export interface ConsentState {
  purpose: ConsentPurpose;
  granted: boolean;
  updatedAt: Date | null;
  noticeVersion: string | null;
}

export type ConsentStateMap = Record<ConsentPurpose, ConsentState>;

/** Every checkbox starts unticked. Marketing is never defaulted to granted. */
export function defaultConsentChoices(): Record<ConsentPurpose, boolean> {
  return Object.fromEntries(CONSENT_PURPOSES.map((p) => [p, false])) as Record<
    ConsentPurpose,
    boolean
  >;
}

/** Latest event per purpose wins; events at the same instant resolve in log (array) order. */
export function latestConsentState(events: readonly ConsentEvent[]): ConsentStateMap {
  const state = Object.fromEntries(
    CONSENT_PURPOSES.map((purpose) => [
      purpose,
      { purpose, granted: false, updatedAt: null, noticeVersion: null } satisfies ConsentState,
    ]),
  ) as ConsentStateMap;
  const ordered = events
    .map((event, index) => ({ event, index, time: toDate(event.at).getTime() }))
    .sort((a, b) => a.time - b.time || a.index - b.index);
  for (const { event, time } of ordered) {
    state[event.purpose] = {
      purpose: event.purpose,
      granted: event.granted,
      updatedAt: new Date(time),
      noticeVersion: event.noticeVersion,
    };
  }
  return state;
}

export function hasConsent(state: ConsentStateMap, purpose: ConsentPurpose): boolean {
  return state[purpose].granted;
}

/** Events to append so the log reflects `choices`; purposes left unchanged produce no event. */
export function consentEventsForChoices(
  current: ConsentStateMap,
  choices: Partial<Record<ConsentPurpose, boolean>>,
  meta: { at: DateInput; noticeVersion: string; source?: string },
): ConsentEvent[] {
  return CONSENT_PURPOSES.filter(
    (purpose) => choices[purpose] !== undefined && choices[purpose] !== current[purpose].granted,
  ).map((purpose) => ({
    purpose,
    granted: choices[purpose] as boolean,
    at: meta.at,
    noticeVersion: meta.noticeVersion,
    ...(meta.source ? { source: meta.source } : {}),
  }));
}

/** One-click "withdraw all marketing", mirroring how easily it was granted. */
export function withdrawAllMarketing(
  current: ConsentStateMap,
  meta: { at: DateInput; noticeVersion: string; source?: string },
): ConsentEvent[] {
  return consentEventsForChoices(
    current,
    Object.fromEntries(MARKETING_CONSENT_PURPOSES.map((p) => [p, false])),
    meta,
  );
}
