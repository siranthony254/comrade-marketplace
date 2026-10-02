import { describe, expect, it } from "vitest";
import { businessSchema, isSlugAvailableShape, makeSlug, normalizeKenyanPhone, placeOrderSchema, registerSchema, safeRedirectPath } from "./validations";

describe("normalizeKenyanPhone", () => {
  it.each([
    ["0712345678", "254712345678"],
    ["0712 345 678", "254712345678"],
    ["+254712345678", "254712345678"],
    ["254712345678", "254712345678"],
    ["0112345678", "254112345678"],
    ["07-12-34-56-78", "254712345678"],
  ])("accepts %s", (input, expected) => expect(normalizeKenyanPhone(input)).toBe(expected));

  it.each(["", "12345", "0812345678", "071234567", "07123456789", "+255712345678", "abcdefghij"])(
    "rejects %s", (input) => expect(normalizeKenyanPhone(input)).toBeNull(),
  );
});

describe("safeRedirectPath", () => {
  it("allows same-site paths", () => {
    expect(safeRedirectPath("/seller")).toBe("/seller");
    expect(safeRedirectPath("/janes-kitchen?x=1")).toBe("/janes-kitchen?x=1");
  });
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "evil.com", ""])("rejects %s", (p) => {
    expect(safeRedirectPath(p)).toBeUndefined();
  });
  it("rejects undefined", () => expect(safeRedirectPath(undefined)).toBeUndefined());
});

describe("slugs", () => {
  it("makes URL-safe slugs", () => {
    expect(makeSlug("Jane's Kitchen!")).toBe("janes-kitchen");
    expect(makeSlug("  Mike  Prints & Design ")).toBe("mike-prints-and-design");
  });
  it("blocks reserved words that would shadow real pages", () => {
    for (const s of ["admin", "api", "login", "seller", "explore"]) {
      expect(isSlugAvailableShape(s).ok, s).toBe(false);
    }
  });
  it("enforces shape", () => {
    expect(isSlugAvailableShape("ab").ok).toBe(false);
    expect(isSlugAvailableShape("Has Space").ok).toBe(false);
    expect(isSlugAvailableShape("double--hyphen").ok).toBe(false);
    expect(isSlugAvailableShape("janes-kitchen").ok).toBe(true);
  });
});

describe("placeOrderSchema", () => {
  const base = {
    businessId: "b1", items: [{ productId: "p1", quantity: 2 }],
    paymentMode: "ESCROW", deliveryMethod: "PICKUP", phone: "0712345678",
  };
  it("normalises the phone", () => {
    const r = placeOrderSchema.parse(base);
    expect(r.phone).toBe("254712345678");
  });
  it("requires an address for delivery", () => {
    expect(placeOrderSchema.safeParse({ ...base, deliveryMethod: "DELIVERY" }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, deliveryMethod: "DELIVERY", deliveryAddress: "Hostel B, Room 4" }).success).toBe(true);
  });
  it("rejects zero, negative and fractional quantities", () => {
    for (const quantity of [0, -1, 1.5]) {
      expect(placeOrderSchema.safeParse({ ...base, items: [{ productId: "p1", quantity }] }).success).toBe(false);
    }
  });
  it("does not accept a client-supplied price or total (they're simply not in the schema)", () => {
    const r = placeOrderSchema.parse({ ...base, total: 1, items: [{ productId: "p1", quantity: 1, price: 1 }] });
    expect(r).not.toHaveProperty("total");
    expect(r.items[0]).not.toHaveProperty("price");
  });
  it("accepts DIRECT_TRANSFER as a payment mode", () => {
    expect(placeOrderSchema.safeParse({ ...base, paymentMode: "DIRECT_TRANSFER" }).success).toBe(true);
  });
});

describe("registerSchema", () => {
  const base = { fullName: "Jane Wanjiku", email: "jane@gmail.com", phone: "0712345678", schoolId: "s1", studentIdNumber: "SCT221-001", password: "password123", wantsToSell: "true" };
  it("does not require (or even accept extra meaning from) an OTP field — registration has none", () => {
    const r = registerSchema.parse(base);
    expect(r).not.toHaveProperty("otp");
  });
  it("still enforces the real requirements", () => {
    expect(registerSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, phone: "0123" }).success).toBe(false);
  });
});

describe("businessSchema mpesa details", () => {
  const base = { name: "Jane's Kitchen", slug: "janes-kitchen", category: "Food & Beverages", acceptsDelivery: false, deliveryAreas: [], isOpen: true };
  it("allows no mpesa setup at all", () => {
    expect(businessSchema.safeParse(base).success).toBe(true);
  });
  it("requires a number once a method is chosen", () => {
    expect(businessSchema.safeParse({ ...base, mpesaMethod: "TILL" }).success).toBe(false);
  });
  it("validates a till/paybill number looks numeric", () => {
    expect(businessSchema.safeParse({ ...base, mpesaMethod: "TILL", mpesaNumber: "abcdef" }).success).toBe(false);
    expect(businessSchema.safeParse({ ...base, mpesaMethod: "TILL", mpesaNumber: "123456" }).success).toBe(true);
  });
  it("normalises a phone-based mpesa number the same way as everywhere else", () => {
    const r = businessSchema.parse({ ...base, mpesaMethod: "PHONE", mpesaNumber: "0712 345 678" });
    expect(r.mpesaNumber).toBe("254712345678");
  });
  it("drops the paybill account when the method isn't PAYBILL", () => {
    const r = businessSchema.parse({ ...base, mpesaMethod: "TILL", mpesaNumber: "123456", mpesaAccount: "should-be-dropped" });
    expect(r.mpesaAccount).toBeNull();
  });
});
