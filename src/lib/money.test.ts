import { describe, expect, it } from "vitest";
import { allowedPaymentModes, calculateAmounts, generateOrderNumber } from "./money";

describe("calculateAmounts", () => {
  it("takes 5% from the seller side of an escrow order; buyer pays exactly the subtotal", () => {
    expect(calculateAmounts(1000, "ESCROW")).toEqual({ subtotal: 1000, total: 1000, platformFee: 50, sellerPayout: 950 });
  });

  it("never charges a fee on ON_DELIVERY orders", () => {
    expect(calculateAmounts(250, "ON_DELIVERY")).toEqual({ subtotal: 250, total: 250, platformFee: 0, sellerPayout: 250 });
  });

  it("always keeps whole shillings and the parts always add back up", () => {
    for (const subtotal of [100, 101, 333, 799, 1234, 9999, 12345]) {
      const a = calculateAmounts(subtotal, "ESCROW");
      expect(Number.isInteger(a.platformFee)).toBe(true);
      expect(a.platformFee + a.sellerPayout).toBe(a.total);
    }
  });

  it("rejects fractional or negative subtotals", () => {
    expect(() => calculateAmounts(10.5, "ESCROW")).toThrow();
    expect(() => calculateAmounts(-1, "ESCROW")).toThrow();
  });
});

describe("allowedPaymentModes", () => {
  it("forces escrow for any service, however small", () => {
    expect(allowedPaymentModes(50, true).allowed).toEqual(["ESCROW"]);
  });
  it("forces escrow at KES 300 and above", () => {
    expect(allowedPaymentModes(300, false).allowed).toEqual(["ESCROW"]);
    expect(allowedPaymentModes(5000, false).allowed).toEqual(["ESCROW"]);
  });
  it("only allows pay-on-delivery below KES 100 (the KES 60 chapati case)", () => {
    expect(allowedPaymentModes(60, false).allowed).toEqual(["ON_DELIVERY"]);
    expect(allowedPaymentModes(99, false).allowed).toEqual(["ON_DELIVERY"]);
  });
  it("lets the buyer choose in between", () => {
    expect(allowedPaymentModes(100, false).allowed).toEqual(["ESCROW", "ON_DELIVERY"]);
    expect(allowedPaymentModes(299, false).allowed).toEqual(["ESCROW", "ON_DELIVERY"]);
  });
});

describe("generateOrderNumber", () => {
  it("has the CM- prefix and no ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOrderNumber()).toMatch(/^CM-[2-9A-HJ-NP-Z]{6}$/);
    }
  });
});
