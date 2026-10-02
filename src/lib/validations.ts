// src/lib/validations.ts
// Input parsing shared by API routes and forms. Every external input goes through here.

import { z } from "zod";
import slugify from "slugify";
import { BUSINESS_CATEGORIES, PLATFORM, RESERVED_SLUGS } from "@/lib/constants/platform";

/**
 * Normalises a Kenyan mobile number to 2547XXXXXXXX / 2541XXXXXXXX.
 * Accepts 07xx…, 01xx…, +2547…, 2547…, with spaces or dashes. Returns null if invalid.
 */
export function normalizeKenyanPhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-()]/g, "");
  const m = /^(?:\+?254|0)([17]\d{8})$/.exec(cleaned);
  return m ? `254${m[1]}` : null;
}

export const phoneSchema = z
  .string()
  .transform((v, ctx) => {
    const n = normalizeKenyanPhone(v);
    if (!n) ctx.addIssue({ code: "custom", message: "Enter a valid Kenyan phone number, e.g. 0712 345 678" });
    return n ?? "";
  });

/** Only same-site relative paths. Blocks open redirects via ?next=https://evil.com, //evil.com and /\evil.com. */
export function safeRedirectPath(path?: string): string | undefined {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return undefined;
  return path;
}

export function makeSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, trim: true }).slice(0, 40);
}

export function isSlugAvailableShape(slug: string): { ok: true } | { ok: false; reason: string } {
  if (slug.length < 3) return { ok: false, reason: "Web address must be at least 3 characters." };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return { ok: false, reason: "Use lowercase letters, numbers and single hyphens only." };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, reason: "That web address is reserved. Try another." };
  return { ok: true };
}

// ── Registration ────────────────────────────────────────────────
export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code we sent you"),
  schoolId: z.string().min(1),
  studentIdNumber: z.string().trim().min(3).max(40),
  courseOfStudy: z.string().trim().max(80).optional().or(z.literal("").transform(() => undefined)),
  yearOfStudy: z.coerce.number().int().min(1).max(7).optional().or(z.literal("").transform(() => undefined)),
  password: z.string().min(8, "Use at least 8 characters").max(100),
  wantsToSell: z.enum(["true", "false"]).transform((v) => v === "true"),
});

// ── Business ────────────────────────────────────────────────────
export const businessSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().toLowerCase().max(40),
  tagline: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().max(800).optional().nullable(),
  category: z.enum(BUSINESS_CATEGORIES),
  whatsappNumber: z.string().trim().optional().nullable()
    .transform((v) => (v ? normalizeKenyanPhone(v) : null)),
  acceptsDelivery: z.boolean(),
  deliveryAreas: z.array(z.string().trim().min(1).max(40)).max(15),
  isOpen: z.boolean(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
});

// ── Product ─────────────────────────────────────────────────────
export const productSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(600),
  type: z.enum(["PHYSICAL", "SERVICE", "DIGITAL"]),
  price: z.number().int().min(10, "Minimum price is KES 10").max(500_000),
  costPrice: z.number().int().min(0).max(500_000).optional().nullable(),
  stock: z.number().int().min(0).max(100_000).optional().nullable(),
  lowStockAlert: z.number().int().min(0).max(1000).optional().nullable(),
  turnaroundDays: z.number().int().min(1).max(90).optional().nullable(),
  images: z.array(z.string().url()).max(PLATFORM.limits.maxImagesPerProduct),
  isActive: z.boolean(),
});

// ── Orders ──────────────────────────────────────────────────────
export const placeOrderSchema = z
  .object({
    businessId: z.string().min(1),
    items: z
      .array(z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(PLATFORM.limits.maxOrderQuantityPerItem),
      }))
      .min(1)
      .max(30),
    paymentMode: z.enum(["ESCROW", "ON_DELIVERY"]),
    deliveryMethod: z.enum(["PICKUP", "DELIVERY"]),
    deliveryAddress: z.string().trim().max(200).optional().nullable(),
    buyerNote: z.string().trim().max(300).optional().nullable(),
    phone: phoneSchema,
  })
  .superRefine((v, ctx) => {
    if (v.deliveryMethod === "DELIVERY" && !v.deliveryAddress) {
      ctx.addIssue({ code: "custom", path: ["deliveryAddress"], message: "Tell the seller where to deliver." });
    }
  });

export const orderActionSchema = z.object({
  action: z.enum(["CONFIRM", "MARK_READY", "MARK_DELIVERED", "RECEIVE", "CANCEL", "DISPUTE"]),
  reason: z.string().trim().max(300).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().nullable(),
});
