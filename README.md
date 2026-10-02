# Comrade Market — Phase 1

A marketplace for verified Kenyan students: free storefronts, safe payments, human-reviewed ID verification.
**Phase 1 scope: students only, one campus first.** Suppliers, finance suite, chama, external clients etc. are deferred (see below).

## Run it locally

You need Node 20+ and a PostgreSQL database. Easiest: create a free project at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com) and copy its connection string.

```bash
npm install
cp .env.example .env.local      # then fill in DATABASE_URL, NEXTAUTH_SECRET, ADMIN_* (see comments inside)
npx prisma migrate dev --name init
npm run db:seed                 # schools + your admin account
npm run dev                     # http://localhost:3000
```

With the defaults (`PAYMENT_PROVIDER=mock`, no SMS or Cloudinary keys) everything works offline:
- Signup needs no SMS provider at all — it was deliberately designed that way (see **Payment & verification model** below). Phone verification codes print to the terminal when you do request one, from `/account/phone`.
- ID photos are saved to `.private-uploads/`, public images to `public/uploads/` (both git-ignored).
- On an unpaid escrow order, a **DEV: simulate paid** button stands in for the M-Pesa PIN.
- Requires Cloudinary in production (see **Before real money moves** below) — not in dev.

**Try the whole loop:** register two students → sign in as admin → `/admin/verification-queue` approve both → student A opens a storefront, sets up M-Pesa collection (till/paybill/phone) at `/seller/storefront`, and adds a product → student B orders it via DIRECT_TRANSFER → marks it paid (with a reference code) → seller confirms they received it → confirms → ready → delivered → buyer confirms receipt.

```bash
npm test          # unit tests: fees, payment rules, order state machine, validation, redirect safety
npm run typecheck
npm run build
```

## How it works

| Piece | Where |
|---|---|
| Business rules (fees, windows, limits) — the single source of truth | `src/lib/constants/platform.ts` |
| Money math + which orders need escrow | `src/lib/money.ts` |
| Order state machine (who may do what, when) | `src/lib/order-state.ts` |
| Orders, escrow, payouts, disputes — the only code that moves money state | `src/lib/services/orders.ts` |
| Payment provider seam (mock + IntaSend) | `src/lib/payments/` |
| Auth (email/phone + password, lockout after 5 fails) | `src/lib/auth.ts`, `src/middleware.ts`, `src/lib/session.ts` |
| Private ID photos | `src/lib/storage.ts` |
| Schema | `prisma/schema.prisma` |

## Payment & verification model

**ID verification is mandatory; phone verification is not.** Signup needs your student ID photo + a selfie, nothing else — no SMS/OTP step, so joining never depends on an SMS provider being configured. A human approves the ID in `/admin/verification-queue`; until then you can browse but not buy, sell or list. **Phone verification is separate and optional**, any time, at `/account/phone` — it doesn't gate anything, it's just a "we confirmed you own this number" checkmark (worth doing since it's the number M-Pesa prompts and payouts use).

**Three payment modes**, decided per order by `allowedPaymentModes()` in `src/lib/money.ts`:
- **ESCROW** — the platform holds the money via a real payment provider (IntaSend), released on confirmed receipt. Only offered once `PAYMENT_PROVIDER=intasend` is actually configured (`isEscrowAvailable()` in `src/lib/payments/index.ts`).
- **ON_DELIVERY** — cash, in person. Only offered below KES 100 (a 5% fee would be pennies, less than the provider's own charges) — never for services or bigger orders, which need some accountability.
- **DIRECT_TRANSFER** — the buyer sends M-Pesa straight to the seller's own till/paybill/phone (set up at `/seller/storefront`), confirms with a reference code and/or screenshot, and the seller confirms receipt before accepting. **This is a stand-in for ESCROW until IntaSend is integrated** — it's the only way services/bigger orders are payable at all right now, since ESCROW isn't live. No fee, because the platform never touches the money — **and no money-safety guarantee either**: if either side lies, the only recourse is the admin dispute system (mediation, not a forced refund). The UI says this plainly to buyers; don't let it be mistaken for escrow.

Fee comes out of the seller's payout on ESCROW only; buyers never pay extra.

## ⚠️ Before real money moves

1. **IntaSend adapter is untested** (`src/lib/payments/intasend.ts`). Run the full flow in the IntaSend **sandbox** (`INTASEND_TEST_MODE=true`) first and fix any field name that differs. Set the webhook to `https://<domain>/api/webhooks/payments` with the same challenge as `INTASEND_WEBHOOK_CHALLENGE`. Until this is done, ESCROW stays unavailable and DIRECT_TRANSFER is the only option for services/bigger orders — see **Payment & verification model** above.
2. **Africa's Talking SMS is untested** (`src/lib/sms.ts`). Only used for `/account/phone` verification codes now, not for signup, so it's lower-stakes than before — but try it in their sandbox before relying on it.
3. **Check the fee maths.** Compare your provider's collection + payout fees with `fees.escrowRate` (5%). If they exceed it, raise the rate or the minimum escrow amount — otherwise every escrow order loses money.
4. **Legal.** Holding customers' money may fall under the National Payment System Act / CBK rules. Take advice, and consider having the licensed provider hold the funds. `/terms` and `/privacy` are placeholders — get them reviewed (Data Protection Act 2019 covers the ID photos). DIRECT_TRANSFER doesn't involve the platform holding money, but get advice on whether facilitating it (showing payment details, mediating disputes) carries its own obligations.
5. **Schedule the maintenance job**: call `GET /api/cron/maintenance` every ~5 min with `Authorization: Bearer $CRON_SECRET`. It reconciles payments whose webhook never arrived, expires unpaid orders, and auto-completes delivered orders after 72h. (Vercel Hobby only allows daily crons — use cron-job.org.)
6. **Payouts are never retried automatically.** A timeout can hide a payout that really went through; retrying would pay twice. Failed payouts appear at `/admin/payouts` for a manual retry after you check the provider dashboard.
7. Use `PAYMENT_PROVIDER=intasend` in production — the mock refuses to run there.
8. **Cloudinary is required in production** (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). `src/lib/storage.ts` refuses to fall back to the local filesystem in production — Vercel's functions can't write to `process.cwd()` outside `/tmp`, so without Cloudinary, every ID-photo and product-image upload fails loudly instead of silently losing data.

## Database connections (Supabase)

If you're on Supabase: use the **Transaction pooler (port 6543, `?pgbouncer=true`)** for the app's `DATABASE_URL`, not the Session pooler (port 5432). Session mode gives each Prisma client a dedicated backend connection for its whole lifetime — fine for one long-lived server, but Vercel can run several warm function instances at once, and the session pool is small (often 15 slots on the free tier). It fills up with idle-but-not-closed connections and schema changes (`prisma db push`/`migrate`) start failing with `EMAXCONNSESSION`. This was hit for real while building this feature — confirmed via `pg_stat_activity` that the session pool was full of idle connections matching this app's own query patterns. Keep using the session pooler (or a direct connection) only for one-off schema commands from your own machine, run one at a time.

## Known gaps (Phase 1)

- No password reset (the login page tells users to contact support). Needs SMS-OTP reset.
- No rate limiting beyond OTP-send and login lockout (add Upstash/Redis limits on `/api/orders` and uploads).
- No automated tests for database code (`services/orders.ts`) against a disposable test DB — it's been exercised manually against the live DB (see commit history), but there's no CI-run suite for it yet.
- Wishlist, messaging, promo cards, invoices are not built.
- Storefront is `/<slug>` on the main domain; per-business subdomains (`slug.domain`) would need wildcard DNS + middleware.
- Verification lasts 12 months (`verificationExpiresAt` is stored) but nothing yet forces re-verification.
- DIRECT_TRANSFER has no automated "did the money actually move" check — Safaricom's Daraja API has no endpoint for a platform to verify or pull a payment into a third party's till/paybill/phone, only into one the platform itself owns. That's a real limitation of M-Pesa, not something more code here fixes.

## Deferred to Phase 2/3

Full designs are kept in `docs/` (`schema.full-vision.prisma`, `api-map.full-vision.ts`) and the unfinished pages in `src/_deferred/` (outside routing, excluded from typecheck).

- **Phase 2:** service escrow with milestones, "I Need" board, richer discovery.
- **Phase 3:** suppliers/wholesale, finance suite (P&L yes; savings wallets need licensing advice), Pro tier, external clients, chama, education, influencers, analytics.
