import { describe, expect, it } from "vitest";
import { CONSENT_PURPOSES } from "../enums";
import {
  CONSENT_PURPOSE_INFO,
  DARK_PATTERN_CHECKLIST,
  GRIEVANCE_ACK_HOURS,
  MARKETING_CONSENT_PURPOSES,
  canAdvanceGrievance,
  consentEventsForChoices,
  defaultConsentChoices,
  grievanceDueDates,
  grievanceSla,
  hasConsent,
  latestConsentState,
  withdrawAllMarketing,
  type ConsentEvent,
} from ".";

describe("grievance SLA", () => {
  const receivedAt = "2026-01-31T05:00:00Z";

  it("acknowledges within 48 hours and resolves within one month", () => {
    expect(GRIEVANCE_ACK_HOURS).toBe(48);
    const due = grievanceDueDates(receivedAt);
    expect(due.acknowledgeBy.toISOString()).toBe("2026-02-02T05:00:00.000Z");
    expect(due.resolveBy.toISOString()).toBe("2026-02-28T05:00:00.000Z"); // clamped, never extended
  });

  it("reports pending, overdue, met and late", () => {
    expect(grievanceSla({ receivedAt, now: "2026-02-01T00:00:00Z" })).toMatchObject({
      acknowledgement: "pending",
      resolution: "pending",
    });
    expect(grievanceSla({ receivedAt, now: "2026-02-03T00:00:00Z" })).toMatchObject({
      acknowledgement: "overdue",
      resolution: "pending",
    });
    expect(
      grievanceSla({
        receivedAt,
        acknowledgedAt: "2026-02-02T05:00:00Z",
        resolvedAt: "2026-03-05T00:00:00Z",
        now: "2026-03-05T00:00:00Z",
      }),
    ).toMatchObject({ acknowledgement: "met", resolution: "late" });
    expect(
      grievanceSla({
        receivedAt,
        acknowledgedAt: "2026-02-04T00:00:00Z",
        now: "2026-03-01T00:00:00Z",
      }),
    ).toMatchObject({
      acknowledgement: "late",
      resolution: "overdue",
    });
  });

  it("counts a quick resolution as acknowledgement", () => {
    expect(
      grievanceSla({ receivedAt, resolvedAt: "2026-02-01T00:00:00Z", now: "2026-02-10T00:00:00Z" }),
    ).toMatchObject({
      acknowledgement: "met",
      resolution: "met",
    });
  });

  it("moves grievances forward only", () => {
    expect(canAdvanceGrievance("received", "acknowledged")).toBe(true);
    expect(canAdvanceGrievance("received", "resolved")).toBe(true);
    expect(canAdvanceGrievance("acknowledged", "in_progress")).toBe(true);
    expect(canAdvanceGrievance("in_progress", "resolved")).toBe(true);
    expect(canAdvanceGrievance("resolved", "in_progress")).toBe(false);
    expect(canAdvanceGrievance("in_progress", "received")).toBe(false);
  });
});

describe("DPDP consent", () => {
  const meta = { at: "2026-10-31T06:30:00Z", noticeVersion: "2026-10", source: "checkout" };

  it("describes every purpose and separates marketing", () => {
    for (const purpose of CONSENT_PURPOSES)
      expect(CONSENT_PURPOSE_INFO[purpose].label).toBeTruthy();
    expect(MARKETING_CONSENT_PURPOSES).toEqual([
      "marketing_email",
      "marketing_whatsapp",
      "marketing_sms",
    ]);
    expect(CONSENT_PURPOSE_INFO.order_processing.necessaryForService).toBe(true);
    expect(CONSENT_PURPOSE_INFO.marketing_email.necessaryForService).toBe(false);
  });

  it("never defaults anything, least of all marketing, to granted", () => {
    expect(Object.values(defaultConsentChoices()).every((v) => v === false)).toBe(true);
    const state = latestConsentState([]);
    for (const purpose of CONSENT_PURPOSES) {
      expect(state[purpose]).toEqual({
        purpose,
        granted: false,
        updatedAt: null,
        noticeVersion: null,
      });
    }
  });

  it("takes the latest event per purpose from an unordered append-only log", () => {
    const events: ConsentEvent[] = [
      {
        purpose: "marketing_email",
        granted: false,
        at: "2026-10-30T00:00:00Z",
        noticeVersion: "v2",
      },
      {
        purpose: "marketing_email",
        granted: true,
        at: "2026-10-01T00:00:00Z",
        noticeVersion: "v1",
      },
      { purpose: "analytics", granted: true, at: "2026-10-05T00:00:00Z", noticeVersion: "v1" },
    ];
    const state = latestConsentState(events);
    expect(state.marketing_email).toMatchObject({ granted: false, noticeVersion: "v2" });
    expect(hasConsent(state, "analytics")).toBe(true);
    expect(hasConsent(state, "marketing_sms")).toBe(false);
    expect(state.analytics.updatedAt?.toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });

  it("breaks same-instant ties by log order", () => {
    const at = "2026-10-30T00:00:00Z";
    const state = latestConsentState([
      { purpose: "marketing_sms", granted: true, at, noticeVersion: "v1" },
      { purpose: "marketing_sms", granted: false, at, noticeVersion: "v1" },
    ]);
    expect(state.marketing_sms.granted).toBe(false);
  });

  it("appends events only for changed choices", () => {
    const current = latestConsentState([
      {
        purpose: "marketing_email",
        granted: true,
        at: "2026-10-01T00:00:00Z",
        noticeVersion: "v1",
      },
    ]);
    expect(
      consentEventsForChoices(current, { marketing_email: true, marketing_whatsapp: true }, meta),
    ).toEqual([
      {
        purpose: "marketing_whatsapp",
        granted: true,
        at: meta.at,
        noticeVersion: "2026-10",
        source: "checkout",
      },
    ]);
    expect(consentEventsForChoices(current, {}, { at: meta.at, noticeVersion: "v1" })).toEqual([]);
  });

  it("withdraws all marketing in one step, as easily as it was given", () => {
    const current = latestConsentState([
      {
        purpose: "marketing_email",
        granted: true,
        at: "2026-10-01T00:00:00Z",
        noticeVersion: "v1",
      },
      { purpose: "marketing_sms", granted: true, at: "2026-10-01T00:00:00Z", noticeVersion: "v1" },
      { purpose: "analytics", granted: true, at: "2026-10-01T00:00:00Z", noticeVersion: "v1" },
    ]);
    const events = withdrawAllMarketing(current, { at: meta.at, noticeVersion: "v1" });
    expect(events.map((e) => [e.purpose, e.granted])).toEqual([
      ["marketing_email", false],
      ["marketing_sms", false],
    ]);
    expect(events[0]).not.toHaveProperty("source");
  });
});

describe("dark patterns checklist", () => {
  it("covers the 13 patterns of the 2023 Guidelines, each with how we avoid it", () => {
    expect(DARK_PATTERN_CHECKLIST).toHaveLength(13);
    expect(new Set(DARK_PATTERN_CHECKLIST.map((p) => p.id)).size).toBe(13);
    for (const pattern of DARK_PATTERN_CHECKLIST) {
      expect(pattern.whatItIs.length).toBeGreaterThan(20);
      expect(pattern.howWeAvoid.length).toBeGreaterThan(20);
      expect(pattern.reviewAt.length).toBeGreaterThan(0);
    }
    expect(DARK_PATTERN_CHECKLIST.map((p) => p.id)).toContain("drip_pricing");
    expect(DARK_PATTERN_CHECKLIST.map((p) => p.id)).toContain("false_urgency");
  });
});
