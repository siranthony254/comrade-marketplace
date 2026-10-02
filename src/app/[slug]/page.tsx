// /<slug> — a student's business website. No dashboard chrome: this IS the business.
// Server-rendered so the slug is real, the page is fast on a phone, and WhatsApp/Facebook get
// a proper preview card (Open Graph tags) when the link is shared to a status.

import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, MessageCircle, Star, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RESERVED_SLUGS } from "@/lib/constants/platform";
import { getCurrentUser } from "@/lib/session";
import { publicName } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";
import { StorefrontOrder, type ViewerState } from "./StorefrontOrder";

export const dynamic = "force-dynamic";

const loadBusiness = cache(async (slug: string) => {
  if (RESERVED_SLUGS.has(slug)) return null;
  return prisma.business.findFirst({
    where: { slug, isActive: true, owner: { user: { status: "ACTIVE" } } },
    include: {
      school: { select: { name: true } },
      products: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      reviews: { orderBy: { createdAt: "desc" }, take: 6, include: { reviewer: { select: { fullName: true } } } },
    },
  });
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const b = await loadBusiness(params.slug);
  if (!b) return { title: "Business not found" };
  const description = b.tagline ?? b.description?.slice(0, 160) ?? `${b.name} — a student business on Comrade Market`;
  const image = b.bannerUrl ?? b.logoUrl;
  return {
    title: b.name,
    description,
    openGraph: { title: `${b.name} · ${b.school.name}`, description, type: "website", images: image ? [{ url: image }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title: b.name, description },
  };
}

export default async function BusinessPage({ params }: { params: { slug: string } }) {
  const business = await loadBusiness(params.slug);
  if (!business) notFound();

  const [user, ratingAgg, completed] = await Promise.all([
    getCurrentUser(),
    prisma.review.aggregate({ where: { businessId: business.id }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.order.count({ where: { businessId: business.id, status: "COMPLETED" } }),
  ]);

  let viewer: ViewerState = { kind: "anon" };
  if (user?.studentProfile) {
    viewer =
      user.studentProfile.id === business.ownerId ? { kind: "owner" }
      : user.status === "ACTIVE" ? { kind: "buyer", phone: user.phone }
      : { kind: "pending" };
  } else if (user) viewer = { kind: "pending" };

  const avg = ratingAgg._avg.rating ?? 0;
  const count = ratingAgg._count._all;
  const wa = business.whatsappNumber ? `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(`Hi ${business.name}, I saw your page on Comrade Market.`)}` : null;

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#1a1a1a]">
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display font-bold text-lg text-primary">Comrade<span className="text-secondary">Market</span></Link>
        <Link href="/explore" className="text-sm text-gray-600 hover:text-gray-900">Browse more</Link>
      </nav>

      <header className="bg-white border-b border-gray-200">
        <div className="h-32 sm:h-44 comrade-gradient">
          {business.bannerUrl && <img src={business.bannerUrl} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-6 -mt-10 sm:-mt-12">
          <div className="flex items-end gap-4">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white bg-white shadow" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl comrade-gradient text-white font-display text-3xl font-bold flex items-center justify-center border-4 border-white shadow">{business.name[0]?.toUpperCase()}</div>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mt-3 flex items-center gap-2">
            {business.name}
            <span title="Verified student" className="text-primary"><BadgeCheck className="w-5 h-5" /></span>
          </h1>
          {business.tagline && <p className="text-gray-600 mt-1">{business.tagline}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-600">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{business.school.name}</span>
            <span>{business.category}</span>
            {count > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-secondary text-secondary" />{avg.toFixed(1)} ({count} review{count === 1 ? "" : "s"})</span>}
            {completed > 0 && <span>{completed} completed order{completed === 1 ? "" : "s"}</span>}
          </div>
          {business.description && <p className="mt-4 text-sm leading-relaxed text-gray-700 whitespace-pre-line">{business.description}</p>}
          <div className="flex flex-wrap gap-2 mt-4 text-xs">
            {business.acceptsDelivery && <span className="inline-flex items-center gap-1 bg-accent text-accent-foreground px-2.5 py-1 rounded-full"><Truck className="w-3.5 h-3.5" />Delivers{business.deliveryAreas.length ? `: ${business.deliveryAreas.join(", ")}` : ""}</span>}
            {!business.isOpen && <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">Not taking orders right now</span>}
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full hover:bg-green-100"><MessageCircle className="w-3.5 h-3.5" />Ask a question</a>}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <StorefrontOrder
          slug={business.slug}
          business={{ id: business.id, name: business.name, isOpen: business.isOpen, acceptsDelivery: business.acceptsDelivery }}
          products={business.products.map((p) => ({ id: p.id, name: p.name, description: p.description, type: p.type, price: p.price, stock: p.stock, image: p.images[0] ?? null, turnaroundDays: p.turnaroundDays }))}
          viewer={viewer}
        />

        {business.reviews.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold mb-4">What comrades say</h2>
            <div className="space-y-3">
              {business.reviews.map((r) => (
                <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{publicName(r.reviewer.fullName)}</span>
                    <span className="text-xs text-gray-500">{timeAgo(r.createdAt)}</span>
                  </div>
                  <div className="flex gap-0.5 my-1">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-secondary text-secondary" : "text-gray-300"}`} />)}</div>
                  {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        Powered by <Link href="/" className="text-primary font-medium">Comrade Market</Link> · Verified student businesses
      </footer>
    </div>
  );
}
