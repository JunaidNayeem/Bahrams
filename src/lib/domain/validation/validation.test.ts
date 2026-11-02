import { describe, expect, it } from "vitest";
import {
  addressSchema,
  bulkEnquirySchema,
  checkoutInputSchema,
  couponCodeSchema,
  dataRequestSchema,
  emailSchema,
  grievanceSchema,
  gstinSchema,
  indianMobileSchema,
  normaliseIndianMobile,
  optionalText,
  pincodeSchema,
  reviewInputSchema,
} from ".";

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? null : result.error?.issues[0]?.message;
}

describe("pincode", () => {
  it.each(["812001", "110001", " 560 001 "])("accepts %s", (pin) => {
    expect(pincodeSchema.safeParse(pin).success).toBe(true);
  });

  it.each(["012345", "81200", "8120011", "81200a", ""])("rejects %s", (pin) => {
    expect(firstMessage(pincodeSchema.safeParse(pin))).toBe("Enter a valid 6-digit PIN code.");
  });

  it("strips spaces", () => {
    expect(pincodeSchema.parse("560 001")).toBe("560001");
  });
});

describe("Indian mobile", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["+91-98765-43210", "+919876543210"],
    ["919876543210", "+919876543210"],
    ["09876543210", "+919876543210"],
    ["6000000000", "+916000000000"],
  ])("normalises %s", (input, expected) => {
    expect(indianMobileSchema.parse(input)).toBe(expected);
  });

  it.each(["5876543210", "987654321", "+1 9876543210", "98765432100", "abcdefghij"])(
    "rejects %s",
    (input) => {
      expect(normaliseIndianMobile(input)).toBeNull();
      expect(firstMessage(indianMobileSchema.safeParse(input))).toBe(
        "Enter a valid 10-digit mobile number.",
      );
    },
  );
});

describe("email and GSTIN", () => {
  it("trims and lower-cases email", () => {
    expect(emailSchema.parse("  Meera@Example.COM ")).toBe("meera@example.com");
    expect(firstMessage(emailSchema.safeParse("not-an-email"))).toBe(
      "Enter a valid email address.",
    );
    expect(emailSchema.safeParse(`${"a".repeat(250)}@x.in`).success).toBe(false);
  });

  it("normalises and checks GSTIN", () => {
    expect(gstinSchema.parse("27aapfu 0939f1zv")).toBe("27AAPFU0939F1ZV");
    expect(firstMessage(gstinSchema.safeParse("27AAPFU0939F1ZA"))).toBe(
      "Enter a valid 15-character GSTIN.",
    );
  });
});

describe("optional text", () => {
  it("treats blank as not given and enforces the limit otherwise", () => {
    const schema = optionalText(5);
    expect(schema.parse("")).toBeUndefined();
    expect(schema.parse("   ")).toBeUndefined();
    expect(schema.parse(undefined)).toBeUndefined();
    expect(schema.parse(" hi ")).toBe("hi");
    expect(firstMessage(schema.safeParse("toolong"))).toBe("Keep this to 5 characters or fewer.");
  });
});

const address = {
  name: "Meera Iyer",
  phone: "98765 43210",
  line1: "12, Gandhi Road",
  line2: "",
  landmark: "Near the post office",
  city: "Bengaluru",
  state: "karnataka",
  pincode: "560001",
};

describe("address", () => {
  it("parses and canonicalises a valid address", () => {
    expect(addressSchema.parse(address)).toEqual({
      ...address,
      phone: "+919876543210",
      line2: undefined,
      state: "Karnataka",
    });
  });

  it("explains each problem", () => {
    const result = addressSchema.safeParse({
      ...address,
      name: "M",
      line1: "",
      city: "",
      state: "Narnia",
      pincode: "000000",
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["name", "line1", "city", "state", "pincode"]));
  });
});

const checkout = {
  email: "meera@example.com",
  phone: "9876543210",
  shippingAddress: address,
  paymentMethod: "upi",
  acceptTerms: true,
} as const;

describe("checkout input", () => {
  it("applies safe defaults: billing same as shipping, no gift wrap, no marketing", () => {
    const parsed = checkoutInputSchema.parse(checkout);
    expect(parsed.billingSameAsShipping).toBe(true);
    expect(parsed.giftWrap).toBe(false);
    expect(parsed.marketingConsent).toEqual({
      marketing_email: false,
      marketing_whatsapp: false,
      marketing_sms: false,
    });
    expect(parsed.gstin).toBeUndefined();
  });

  it("requires the terms to be accepted", () => {
    expect(firstMessage(checkoutInputSchema.safeParse({ ...checkout, acceptTerms: false }))).toBe(
      "Please accept the terms, shipping and returns policies to place your order.",
    );
  });

  it("requires a billing address when it differs", () => {
    const result = checkoutInputSchema.safeParse({ ...checkout, billingSameAsShipping: false });
    expect(result.error?.issues[0].path).toEqual(["billingAddress"]);
    expect(
      checkoutInputSchema.safeParse({
        ...checkout,
        billingSameAsShipping: false,
        billingAddress: address,
      }).success,
    ).toBe(true);
  });

  it("requires a business name with a GSTIN", () => {
    const result = checkoutInputSchema.safeParse({ ...checkout, gstin: "27AAPFU0939F1ZV" });
    expect(result.error?.issues[0].path).toEqual(["businessName"]);
    const ok = checkoutInputSchema.parse({
      ...checkout,
      gstin: "27AAPFU0939F1ZV",
      businessName: "Meera Boutique",
    });
    expect(ok.gstin).toBe("27AAPFU0939F1ZV");
  });

  it("validates payment method, coupon and gift message", () => {
    expect(
      firstMessage(checkoutInputSchema.safeParse({ ...checkout, paymentMethod: "bitcoin" })),
    ).toBe("Choose a payment method.");
    expect(checkoutInputSchema.parse({ ...checkout, couponCode: " festive10 " }).couponCode).toBe(
      "FESTIVE10",
    );
    expect(checkoutInputSchema.parse({ ...checkout, couponCode: "" }).couponCode).toBeUndefined();
    expect(couponCodeSchema.safeParse("A!").success).toBe(false);
    expect(
      checkoutInputSchema.safeParse({ ...checkout, giftMessage: "x".repeat(251) }).success,
    ).toBe(false);
  });
});

describe("review input", () => {
  const review = {
    productId: "6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f",
    rating: 5,
    body: "The tussar has a lovely natural sheen and the drape is light.",
    displayName: "Meera",
  };

  it("accepts a valid review and defaults photos", () => {
    const parsed = reviewInputSchema.parse(review);
    expect(parsed).toMatchObject({ rating: 5, photoPaths: [] });
    expect(parsed.title).toBeUndefined();
  });

  it.each([0, 6, 4.5])("rejects rating %s", (rating) => {
    expect(reviewInputSchema.safeParse({ ...review, rating }).success).toBe(false);
  });

  it("rejects short reviews, bad ids and too many photos", () => {
    expect(firstMessage(reviewInputSchema.safeParse({ ...review, body: "Nice" }))).toBe(
      "Tell us a little more: at least 20 characters.",
    );
    expect(reviewInputSchema.safeParse({ ...review, productId: "123" }).success).toBe(false);
    expect(
      reviewInputSchema.safeParse({ ...review, photoPaths: Array(6).fill("p.webp") }).success,
    ).toBe(false);
  });
});

describe("bulk enquiry", () => {
  const enquiry = {
    name: "Ravi Kumar",
    email: "ravi@boutique.in",
    phone: "9123456789",
    city: "Kolkata",
    buyerType: "boutique",
    interests: ["fabric"],
    message: "Looking for 40 m of matka silk in natural.",
  };

  it("accepts a valid enquiry with optional GSTIN left blank", () => {
    expect(bulkEnquirySchema.parse({ ...enquiry, gstin: "" }).gstin).toBeUndefined();
  });

  it("requires at least one product type and a valid kind", () => {
    expect(bulkEnquirySchema.safeParse({ ...enquiry, interests: [] }).success).toBe(false);
    expect(bulkEnquirySchema.safeParse({ ...enquiry, interests: ["shoes"] }).success).toBe(false);
    expect(bulkEnquirySchema.safeParse({ ...enquiry, gstin: "BAD" }).success).toBe(false);
  });
});

describe("grievance", () => {
  const grievance = {
    name: "Anita Das",
    email: "anita@example.com",
    category: "return_or_exchange",
    description: "My return pickup was scheduled twice but nobody came.",
  };

  it("accepts optional phone and order number when blank", () => {
    expect(grievanceSchema.parse({ ...grievance, phone: "", orderNumber: "" })).toMatchObject({
      phone: undefined,
      orderNumber: undefined,
    });
  });

  it("normalises a given order number and validates it", () => {
    expect(
      grievanceSchema.parse({ ...grievance, orderNumber: " #bs-2627-000123 " }).orderNumber,
    ).toBe("BS-2627-000123");
    expect(firstMessage(grievanceSchema.safeParse({ ...grievance, orderNumber: "12345" }))).toMatch(
      /order number/,
    );
  });

  it("rejects short descriptions and unknown categories", () => {
    expect(grievanceSchema.safeParse({ ...grievance, description: "bad" }).success).toBe(false);
    expect(grievanceSchema.safeParse({ ...grievance, category: "spam" }).success).toBe(false);
  });
});

describe("data request", () => {
  it("accepts access and erasure without details", () => {
    expect(dataRequestSchema.safeParse({ type: "access", email: "a@b.in" }).success).toBe(true);
    expect(
      dataRequestSchema.safeParse({ type: "erasure", email: "a@b.in", details: "" }).success,
    ).toBe(true);
  });

  it("requires details for correction and nomination", () => {
    const correction = dataRequestSchema.safeParse({ type: "correction", email: "a@b.in" });
    expect(correction.error?.issues[0]).toMatchObject({ path: ["details"] });
    expect(firstMessage(correction)).toMatch(/which details are wrong/);
    expect(
      firstMessage(dataRequestSchema.safeParse({ type: "nomination", email: "a@b.in" })),
    ).toMatch(/nominating/);
    expect(
      dataRequestSchema.safeParse({
        type: "correction",
        email: "a@b.in",
        details: "Spelling of surname",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown request types", () => {
    expect(dataRequestSchema.safeParse({ type: "sell", email: "a@b.in" }).success).toBe(false);
  });
});
