/**
 * The 13 dark patterns specified in Annexure 1 of the Guidelines for Prevention and Regulation
 * of Dark Patterns, 2023 (CCPA). The E-Commerce (Amendment) Rules 2026 add a yearly self-audit,
 * so every storefront and checkout change is reviewed against this list before release.
 */

export type DarkPatternId =
  | "false_urgency"
  | "basket_sneaking"
  | "confirm_shaming"
  | "forced_action"
  | "subscription_trap"
  | "interface_interference"
  | "bait_and_switch"
  | "drip_pricing"
  | "disguised_advertisement"
  | "nagging"
  | "trick_question"
  | "saas_billing"
  | "rogue_malware";

export interface DarkPatternCheck {
  id: DarkPatternId;
  name: string;
  /** What the guidelines prohibit, in plain words. */
  whatItIs: string;
  /** How Bahram Silks avoids it; the reviewer checks the build against this. */
  howWeAvoid: string;
  /** Where to look during the UI review. */
  reviewAt: readonly string[];
}

export const DARK_PATTERN_CHECKLIST: readonly DarkPatternCheck[] = [
  {
    id: "false_urgency",
    name: "False urgency",
    whatItIs:
      "Falsely stating or implying scarcity or urgency, such as fake countdown timers or invented 'only 2 left' and '20 people viewing' messages.",
    howWeAvoid:
      "No countdown timers or viewer counts. 'One of a kind' appears only on pieces whose stock record is quantity 1, and sale end dates come from the real promotion schedule.",
    reviewAt: ["product page", "collection grid", "announcement bar", "promotions admin"],
  },
  {
    id: "basket_sneaking",
    name: "Basket sneaking",
    whatItIs:
      "Adding items, donations or paid services to the cart at checkout without the shopper's consent.",
    howWeAvoid:
      "Nothing is added to the cart that the shopper did not choose. Gift wrap and swatches are unticked opt-ins, each with its price shown beside it.",
    reviewAt: ["cart", "checkout"],
  },
  {
    id: "confirm_shaming",
    name: "Confirm shaming",
    whatItIs:
      "Using guilt, fear or ridicule to push a choice, such as 'No thanks, I don't support weavers'.",
    howWeAvoid:
      "Decline options use neutral words ('No thanks', 'Not now'). Weaver stories appear as information, never as pressure on a button.",
    reviewAt: ["newsletter prompt", "checkout", "account privacy settings"],
  },
  {
    id: "forced_action",
    name: "Forced action",
    whatItIs:
      "Making the shopper buy, sign up or share extra data to get what they came for, such as forcing account creation or app download.",
    howWeAvoid:
      "Guest checkout is always available. We ask only for what delivery and GST invoicing need; marketing consent is never a condition of buying.",
    reviewAt: ["checkout", "login", "consent prompts"],
  },
  {
    id: "subscription_trap",
    name: "Subscription trap",
    whatItIs:
      "Making cancellation hard or hidden, hiding the cancel option, or taking payment details for 'free' trials that auto-debit.",
    howWeAvoid:
      "We sell no subscriptions. Every marketing opt-in can be withdrawn in one click from the account privacy page or the link in each message.",
    reviewAt: ["account privacy settings", "email and WhatsApp footers"],
  },
  {
    id: "interface_interference",
    name: "Interface interference",
    whatItIs:
      "Design that highlights some information and hides or obscures other relevant information to steer the shopper.",
    howWeAvoid:
      "Accept and decline buttons have equal weight; fees, return exclusions and fibre composition use the same type size as the price; COD and prepaid totals are both shown plainly.",
    reviewAt: ["checkout payment step", "cookie and consent prompts", "product page"],
  },
  {
    id: "bait_and_switch",
    name: "Bait and switch",
    whatItIs: "Advertising one outcome, price or product and delivering a different one.",
    howWeAvoid:
      "The photographed piece is the piece shipped (one-of-a-kind SKUs), the advertised price is the cart price, and coupon terms are stated where the coupon is promoted.",
    reviewAt: ["campaign banners", "product page", "cart"],
  },
  {
    id: "drip_pricing",
    name: "Drip pricing",
    whatItIs:
      "Revealing extra charges only late in checkout, or showing a price without the charges that will be added.",
    howWeAvoid:
      "Prices include GST. Shipping and the COD fee are shown on the product page and in the cart, and the itemised total does not change at payment except for choices the shopper makes.",
    reviewAt: ["product page", "cart", "checkout"],
  },
  {
    id: "disguised_advertisement",
    name: "Disguised advertisement",
    whatItIs: "Passing off advertising as editorial content, reviews or user-generated posts.",
    howWeAvoid:
      "Paid influencer content and gifted pieces are labelled as such. Reviews are published as customers wrote them; staff never write or edit them.",
    reviewAt: ["journal", "reviews", "Instagram feed"],
  },
  {
    id: "nagging",
    name: "Nagging",
    whatItIs:
      "Repeated requests, pop-ups or notifications that interrupt the shopper to push a choice.",
    howWeAvoid:
      "At most one newsletter prompt per visit, never shown again once dismissed. No notification-permission prompts on page load.",
    reviewAt: ["home page", "product page", "newsletter prompt"],
  },
  {
    id: "trick_question",
    name: "Trick question",
    whatItIs:
      "Confusing wording, such as double negatives, that leads the shopper to an answer they did not intend.",
    howWeAvoid:
      "Every checkbox is a plain positive statement ('Email me about new collections') and unticked by default.",
    reviewAt: ["checkout", "account privacy settings", "consent prompts"],
  },
  {
    id: "saas_billing",
    name: "SaaS billing",
    whatItIs:
      "Silently charging recurring payments, for example converting a free trial into a paid plan without notice.",
    howWeAvoid:
      "No recurring charges exist. Every payment is a one-off order the shopper confirms on the Razorpay screen.",
    reviewAt: ["payments", "checkout"],
  },
  {
    id: "rogue_malware",
    name: "Rogue malware",
    whatItIs: "Using ransomware or scareware to mislead or trick users into paying for a fake fix.",
    howWeAvoid:
      "No third-party scripts outside the approved list (payments, analytics with consent); no fake security warnings or download prompts.",
    reviewAt: ["third-party scripts", "site-wide"],
  },
];
