import { describe, expect, it } from "vitest";
import { nextStatus, type Actor, type OrderAction, type OrderStatus } from "./order-state";

const ok = (s: OrderStatus, a: OrderAction, who: Actor) => {
  const t = nextStatus(s, a, who);
  return t.ok ? t.to : null;
};

describe("happy path", () => {
  it("walks PLACED -> COMPLETED with the right person acting each step", () => {
    expect(ok("PLACED", "CONFIRM", "SELLER")).toBe("CONFIRMED");
    expect(ok("CONFIRMED", "MARK_READY", "SELLER")).toBe("READY");
    expect(ok("READY", "MARK_DELIVERED", "SELLER")).toBe("DELIVERED");
    expect(ok("DELIVERED", "RECEIVE", "BUYER")).toBe("COMPLETED");
  });
});

describe("who may do what", () => {
  it("a buyer cannot confirm, ready or deliver their own order", () => {
    expect(ok("PLACED", "CONFIRM", "BUYER")).toBeNull();
    expect(ok("CONFIRMED", "MARK_READY", "BUYER")).toBeNull();
    expect(ok("READY", "MARK_DELIVERED", "BUYER")).toBeNull();
  });
  it("a seller can never release their own money by confirming receipt", () => {
    for (const s of ["READY", "DELIVERED"] as OrderStatus[]) {
      expect(ok(s, "RECEIVE", "SELLER")).toBeNull();
    }
  });
  it("only the buyer can dispute", () => {
    expect(ok("DELIVERED", "DISPUTE", "SELLER")).toBeNull();
    expect(ok("DELIVERED", "DISPUTE", "SYSTEM")).toBeNull();
    expect(ok("DELIVERED", "DISPUTE", "BUYER")).toBe("DISPUTED");
  });
});

describe("no skipping steps", () => {
  it("cannot ready an unconfirmed order or deliver an unready one", () => {
    expect(ok("PLACED", "MARK_READY", "SELLER")).toBeNull();
    expect(ok("CONFIRMED", "MARK_DELIVERED", "SELLER")).toBeNull();
  });
  it("a buyer cannot 'receive' an order the seller hasn't prepared", () => {
    for (const s of ["PENDING_PAYMENT", "PLACED", "CONFIRMED"] as OrderStatus[]) {
      expect(ok(s, "RECEIVE", "BUYER")).toBeNull();
    }
  });
});

describe("auto-release", () => {
  it("SYSTEM may complete only a DELIVERED order (never READY: the seller must claim delivery first)", () => {
    expect(ok("DELIVERED", "RECEIVE", "SYSTEM")).toBe("COMPLETED");
    expect(ok("READY", "RECEIVE", "SYSTEM")).toBeNull();
    expect(ok("DISPUTED", "RECEIVE", "SYSTEM")).toBeNull();
  });
});

describe("terminal and contested states are frozen", () => {
  const frozen: OrderStatus[] = ["COMPLETED", "CANCELLED", "DISPUTED"];
  const actions: OrderAction[] = ["CONFIRM", "MARK_READY", "MARK_DELIVERED", "RECEIVE", "CANCEL", "DISPUTE"];
  const actors: Actor[] = ["BUYER", "SELLER", "SYSTEM"];
  it("nothing can move a COMPLETED / CANCELLED / DISPUTED order (disputes go through an admin)", () => {
    for (const s of frozen) for (const a of actions) for (const who of actors) {
      expect(ok(s, a, who), `${s} ${a} ${who}`).toBeNull();
    }
  });
});

describe("cancellation", () => {
  it("buyer can cancel before the seller starts; seller can decline until READY", () => {
    expect(ok("PENDING_PAYMENT", "CANCEL", "BUYER")).toBe("CANCELLED");
    expect(ok("PLACED", "CANCEL", "BUYER")).toBe("CANCELLED");
    expect(ok("CONFIRMED", "CANCEL", "BUYER")).toBeNull();
    expect(ok("CONFIRMED", "CANCEL", "SELLER")).toBe("CANCELLED");
    expect(ok("READY", "CANCEL", "SELLER")).toBeNull();
  });
  it("SYSTEM can only expire unpaid orders", () => {
    expect(ok("PENDING_PAYMENT", "CANCEL", "SYSTEM")).toBe("CANCELLED");
    expect(ok("PLACED", "CANCEL", "SYSTEM")).toBeNull();
  });
});
