// src/app/api/README.md (as a .ts file for discoverability)
// ═══════════════════════════════════════════════════════════════
// COMRADE MARKET — COMPLETE API ROUTE MAP
// All routes follow Next.js App Router convention: route.ts files
// ═══════════════════════════════════════════════════════════════
//
// AUTH
//   POST   /api/auth/register/student        — register student, trigger ID verify
//   POST   /api/auth/register/supplier       — submit supplier application (PENDING)
//   POST   /api/auth/register/external       — register external client
//   POST   /api/auth/login                   — login all roles, returns JWT + role
//   POST   /api/auth/logout                  — clear session
//   POST   /api/auth/verify-student-id       — face-api.js comparison server call
//   POST   /api/auth/forgot-password         — send reset email
//   POST   /api/auth/reset-password          — update password with token
//
// SCHOOLS
//   GET    /api/schools                      — list all schools (for dropdown)
//
// SELLER / BUSINESS
//   GET    /api/seller/dashboard             — stats for seller home
//   GET    /api/seller/products              — list own products
//   POST   /api/seller/products              — create product
//   PATCH  /api/seller/products/:id          — update product
//   PATCH  /api/seller/products/:id/toggle   — toggle isActive
//   GET    /api/seller/orders                — list orders (with filter/pagination)
//   PATCH  /api/seller/orders/:id/status     — advance order status
//   GET    /api/seller/financials            — P&L data for selected period
//   GET    /api/seller/invoices              — list invoices
//   POST   /api/seller/invoices              — create invoice, generate PDF
//   POST   /api/seller/expenses              — log expense
//   GET    /api/seller/savings/goals         — list savings goals
//   POST   /api/seller/savings/goals         — create goal
//   PATCH  /api/seller/savings/goals/:id     — update auto-save %
//   POST   /api/seller/savings/withdraw      — withdraw to M-Pesa
//   POST   /api/seller/marketing/promo-card  — generate branded promo image
//   GET    /api/seller/storefront            — get own business data
//   PATCH  /api/seller/storefront            — update business page
//
// BUYER
//   GET    /api/buyer/orders                 — buyer's order history
//   PATCH  /api/buyer/orders/:id/confirm-receipt — release escrow to seller
//   GET    /api/buyer/wishlist               — wishlist items
//   POST   /api/buyer/wishlist               — add to wishlist
//   DELETE /api/buyer/wishlist/:id           — remove from wishlist
//
// MARKETPLACE (public)
//   GET    /api/marketplace/businesses       — browse businesses (filtered/paginated)
//   GET    /api/marketplace/businesses/:slug — single business page data
//   GET    /api/marketplace/services         — browse student services
//
// ORDERS & ESCROW
//   POST   /api/orders                       — place order (creates escrow hold)
//   GET    /api/orders/:id                   — order details
//   POST   /api/orders/:id/dispute           — raise dispute
//   POST   /api/reviews                      — submit review after completion
//
// MESSAGES
//   GET    /api/messages/:userId             — conversation with a user
//   POST   /api/messages                     — send message
//   GET    /api/messages/unread-count        — for header badge
//
// NOTIFICATIONS
//   GET    /api/notifications                — list notifications
//   PATCH  /api/notifications/read-all       — mark all read
//   PATCH  /api/notifications/:id/read       — mark one read
//
// SUPPLIERS
//   GET    /api/suppliers/catalogue          — public supplier catalogue (for students)
//   GET    /api/supplier/dashboard           — supplier stats
//   GET    /api/supplier/catalogue           — supplier's own listings
//   POST   /api/supplier/products            — add wholesale product
//   PATCH  /api/supplier/products/:id        — update (price lock enforced)
//   GET    /api/supplier/orders              — incoming wholesale orders
//   PATCH  /api/supplier/orders/:id/confirm  — confirm order
//   PATCH  /api/supplier/orders/:id/dispatch — mark dispatched
//   GET    /api/supplier/analytics           — supplier analytics data
//
// WHOLESALE / GROUP ORDERS
//   GET    /api/wholesale/group-orders       — open group orders for a product
//   POST   /api/wholesale/group-orders       — create group order
//   POST   /api/wholesale/group-orders/:id/join — join group order
//   POST   /api/wholesale/orders             — place individual wholesale order
//
// SERVICE MARKETPLACE
//   GET    /api/service-briefs               — list briefs (filter by postedBy)
//   POST   /api/service-briefs               — post brief (supplier or client)
//   GET    /api/service-briefs/:id           — brief details + bids
//   POST   /api/service-briefs/:id/bids      — submit bid
//   POST   /api/service-briefs/:id/award/:bidId — award to bidder
//
// INFLUENCERS
//   GET    /api/influencers                  — browse student influencers
//   POST   /api/influencer-campaigns         — commission a campaign
//
// CHAMAS
//   GET    /api/chamas                       — list chamas (filtered by school)
//   POST   /api/chamas                       — create chama
//   POST   /api/chamas/:id/join              — join chama
//   POST   /api/chamas/:id/contribute        — log contribution
//
// EDUCATION
//   GET    /api/education/lessons            — list lessons
//   GET    /api/education/lessons/:id        — lesson content
//   POST   /api/education/progress           — mark lesson complete
//   GET    /api/challenges                   — active challenges
//   GET    /api/challenges/leaderboard       — leaderboard by campus/national
//
// PAYMENTS (IntaSend / Stripe webhooks)
//   POST   /api/payments/initiate            — start M-Pesa STK push or card
//   POST   /api/payments/webhook/intasend    — IntaSend callback
//   POST   /api/payments/webhook/stripe      — Stripe webhook
//
// ADMIN
//   GET    /api/admin/stats                  — platform-wide overview
//   GET    /api/admin/verifications          — pending verifications
//   PATCH  /api/admin/verifications/:id      — approve or reject
//   GET    /api/admin/disputes               — all disputes
//   POST   /api/admin/disputes/:id/resolve   — make ruling
//   GET    /api/admin/suppliers              — all suppliers
//   POST   /api/admin/suppliers/:id/strikes  — issue strike
//   PATCH  /api/admin/suppliers/:id/suspend  — suspend supplier
//   GET    /api/admin/analytics              — revenue & usage analytics

export {}; // makes this a module
