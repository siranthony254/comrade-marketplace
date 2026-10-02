import { describe, expect, it } from "vitest";
import { allowedPaymentModes, calculateAmounts, generateOrderNumber } from "./money";

describe("calculateAmounts", () => {
  it("takes 5% from the seller side of an escrow order; buyer pays exactly the subtotal", () => {
    expect(calculateAmounts(1000, "ESCROW")).toEqual({ subtotal: 1000, total: 1000, platformFee: 50, sellerPayout: 950 });
  });

  it("never charges a fee on ON_DELIVERY orders", () => {
    expect(calculateAmounts(250, "ON_DELIVERY")).toEqual({ subtotal: 250, total: 250, platformFee: 0, sellerPayout: 250 });
  });

  it("never charges a fee on DIRECT_TRANSFER orders either — the platform never touches that money", () => {
    expect(calculateAmounts(1500, "DIRECT_TRANSFER")).toEqual({ subtotal: 1500, total: 1500, platformFee: 0, sellerPayout: 1500 });
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
  describe("when a real escrow provider is available", () => {
    it("offers escrow or direct-transfer for any service, however small — never plain cash", () => {
      expect(allowedPaymentModes(50, true, true).allowed).toEqual(["ESCROW", "DIRECT_TRANSFER"]);
    });
    it("offers escrow or direct-transfer at KES 300 and above — never plain cash", () => {
      expect(allowedPaymentModes(300, false, true).allowed).toEqual(["ESCROW", "DIRECT_TRANSFER"]);
      expect(allowedPaymentModes(5000, false, true).allowed).toEqual(["ESCROW", "DIRECT_TRANSFER"]);
    });
    it("below KES 100, cash or direct-transfer (escrow's fee would be pennies, not worth it)", () => {
      expect(allowedPaymentModes(60, false, true).allowed).toEqual(["ON_DELIVERY", "DIRECT_TRANSFER"]);
      expect(allowedPaymentModes(99, false, true).allowed).toEqual(["ON_DELIVERY", "DIRECT_TRANSFER"]);
    });
    it("lets the buyer choose freely in between", () => {
      expect(allowedPaymentModes(100, false, true).allowed).toEqual(["ESCROW", "ON_DELIVERY", "DIRECT_TRANSFER"]);
      expect(allowedPaymentModes(299, false, true).allowed).toEqual(["ESCROW", "ON_DELIVERY", "DIRECT_TRANSFER"]);
    });
  });

  describe("when escrow is NOT available (no payment provider configured yet)", () => {
    it("direct-transfer is the only option for services — never plain cash", () => {
      expect(allowedPaymentModes(50, true, false).allowed).toEqual(["DIRECT_TRANSFER"]);
    });
    it("direct-transfer is the only option at KES 300 and above", () => {
      expect(allowedPaymentModes(300, false, false).allowed).toEqual(["DIRECT_TRANSFER"]);
      expect(allowedPaymentModes(5000, false, false).allowed).toEqual(["DIRECT_TRANSFER"]);
    });
    it("below KES 100, cash or direct-transfer — unaffected by escrow's availability", () => {
      expect(allowedPaymentModes(60, false, false).allowed).toEqual(["ON_DELIVERY", "DIRECT_TRANSFER"]);
    });
    it("in between, cash or direct-transfer, never escrow", () => {
      expect(allowedPaymentModes(150, false, false).allowed).toEqual(["ON_DELIVERY", "DIRECT_TRANSFER"]);
    });
  });

  it("never offers plain cash for a service or a big order, regardless of escrow availability", () => {
    for (const escrowAvailable of [true, false]) {
      expect(allowedPaymentModes(50, true, escrowAvailable).allowed).not.toContain("ON_DELIVERY");
      expect(allowedPaymentModes(500, false, escrowAvailable).allowed).not.toContain("ON_DELIVERY");
    }
  });
});

describe("generateOrderNumber", () => {
  it("has the CM- prefix and no ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOrderNumber()).toMatch(/^CM-[2-9A-HJ-NP-Z]{6}$/);
    }
  });
});
