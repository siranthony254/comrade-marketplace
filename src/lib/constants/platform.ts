// src/lib/constants/platform.ts
// Single source of truth for Phase 1 business rules. Import from here — never
// hardcode a fee, window or limit anywhere else.

export const PLATFORM = {
  name: "Comrade Market",
  currency: "KES",

  fees: {
    // Taken from the SELLER's side of an ESCROW order, never added on top of what
    // the buyer pays. ON_DELIVERY orders are free.
    // CHECK against your payment provider's collection + payout fees before launch:
    // if they exceed this on small orders, the platform loses money on each one.
    escrowRate: 0.05,
  },

  escrow: {
    // Orders below this cannot use escrow: the fee would be pennies and the
    // provider's own charges would exceed it.
    unavailableBelowKes: 100,
    // Orders at or above this (or containing any SERVICE) must use escrow.
    requiredAtOrAboveKes: 300,
    // After the seller marks DELIVERED the buyer has this long to confirm or
    // dispute. Silence = the order completes and the seller is paid.
    autoReleaseHours: 72,
    // An unpaid ESCROW order is cancelled (and its stock returned) after this.
    pendingPaymentMinutes: 15,
  },

  verification: {
    validityMonths: 12, // re-verify yearly so graduates drop out
  },

  otp: {
    length: 6,
    ttlMinutes: 10,
    maxAttempts: 5,
    maxSendsPerHour: 3,
  },

  login: {
    maxFailures: 5,
    lockMinutes: 15,
  },

  limits: {
    maxProductsFree: 10,
    maxImagesPerProduct: 4,
    maxUploadBytes: 5 * 1024 * 1024,
    maxOrderQuantityPerItem: 50,
  },
} as const;

export const BUSINESS_CATEGORIES = [
  "Food & Beverages",
  "Fashion & Clothing",
  "Beauty & Hair",
  "Electronics & Repairs",
  "Printing & Stationery",
  "Design & Creative",
  "Writing & Tutoring",
  "Photography & Video",
  "Tech & Coding",
  "Books & Notes",
  "Laundry & Cleaning",
  "Other",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

// Business pages live at /<slug>, so a slug must never shadow a real route.
export const RESERVED_SLUGS = new Set([
  "admin", "api", "login", "logout", "register", "signup", "seller", "buyer",
  "client", "supplier", "explore", "orders", "about", "terms", "privacy",
  "contact", "help", "support", "coming-soon", "dashboard", "settings",
  "account", "static", "public", "_next", "favicon", "robots", "sitemap",
  "comrade", "comrades", "market", "marketplace", "www", "app", "null", "undefined",
]);
