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
- SMS codes print in the terminal (and show on the signup form in dev).
- ID photos are saved to `.private-uploads/`, public images to `public/uploads/` (both git-ignored).
- On an unpaid escrow order, a **DEV: simulate paid** button stands in for the M-Pesa PIN.

**Try the whole loop:** register two students → sign in as admin → `/admin/verification-queue` approve both → student A opens a storefront and adds a product → student B orders it → seller confirms → ready → delivered → buyer confirms receipt → payout logged in the terminal.

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

**Payment rules.** Services and orders ≥ KES 300 must use escrow. Orders < KES 100 are pay-on-delivery only (a 5% fee would be pennies, less than the provider's own charges). In between the buyer chooses. The 5% fee comes out of the seller's payout; buyers never pay extra.

**Verification.** Signup stores the ID photo + selfie privately and puts the account in `PENDING_REVIEW`. A human approves it in `/admin/verification-queue`. Until then the user can browse but cannot buy, sell or list. Nothing about verification is decided by the browser.

## ⚠️ Before real money moves

1. **IntaSend adapter is untested** (`src/lib/payments/intasend.ts`). Run the full flow in the IntaSend **sandbox** (`INTASEND_TEST_MODE=true`) first and fix any field name that differs. Set the webhook to `https://<domain>/api/webhooks/payments` with the same challenge as `INTASEND_WEBHOOK_CHALLENGE`.
2. **Africa's Talking SMS is untested** (`src/lib/sms.ts`). Try it in their sandbox.
3. **Check the fee maths.** Compare your provider's collection + payout fees with `fees.escrowRate` (5%). If they exceed it, raise the rate or the minimum escrow amount — otherwise every escrow order loses money.
4. **Legal.** Holding customers' money may fall under the National Payment System Act / CBK rules. Take advice, and consider having the licensed provider hold the funds. `/terms` and `/privacy` are placeholders — get them reviewed (Data Protection Act 2019 covers the ID photos).
5. **Schedule the maintenance job**: call `GET /api/cron/maintenance` every ~5 min with `Authorization: Bearer $CRON_SECRET`. It reconciles payments whose webhook never arrived, expires unpaid orders, and auto-completes delivered orders after 72h. (Vercel Hobby only allows daily crons — use cron-job.org.)
6. **Payouts are never retried automatically.** A timeout can hide a payout that really went through; retrying would pay twice. Failed payouts appear at `/admin/payouts` for a manual retry after you check the provider dashboard.
7. Use `PAYMENT_PROVIDER=intasend` in production — the mock refuses to run there.

## Known gaps (Phase 1)

- No password reset (the login page tells users to contact support). Needs SMS-OTP reset.
- No rate limiting beyond OTP-send and login lockout (add Upstash/Redis limits on `/api/orders` and uploads).
- No automated tests for database code (`services/orders.ts`) — it needs a test database. Highest-value next tests: double-click on receive, late payment on a cancelled order, last-item race.
- Wishlist, messaging, promo cards, invoices are not built.
- Storefront is `/<slug>` on the main domain; per-business subdomains (`slug.domain`) would need wildcard DNS + middleware.
- Verification lasts 12 months (`verificationExpiresAt` is stored) but nothing yet forces re-verification.

## Deferred to Phase 2/3

Full designs are kept in `docs/` (`schema.full-vision.prisma`, `api-map.full-vision.ts`) and the unfinished pages in `src/_deferred/` (outside routing, excluded from typecheck).

- **Phase 2:** service escrow with milestones, "I Need" board, richer discovery.
- **Phase 3:** suppliers/wholesale, finance suite (P&L yes; savings wallets need licensing advice), Pro tier, external clients, chama, education, influencers, analytics.
