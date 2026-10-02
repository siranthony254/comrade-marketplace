// /seller/storefront — create or edit your business page.

import { requireStudent } from "@/lib/session";
import { StorefrontForm } from "./StorefrontForm";

export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  const { user, profile } = await requireStudent();
  const b = profile.business;
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{b ? "Your storefront" : "Open your storefront"}</h1>
        <p className="text-sm text-muted-foreground">This is your business website. Share the link anywhere.</p>
      </div>
      <StorefrontForm
        canEdit={user.status === "ACTIVE"}
        baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
        initial={b ? {
          name: b.name, slug: b.slug, tagline: b.tagline ?? "", description: b.description ?? "", category: b.category,
          whatsappNumber: b.whatsappNumber ? `0${b.whatsappNumber.slice(3)}` : "", acceptsDelivery: b.acceptsDelivery,
          deliveryAreas: b.deliveryAreas.join(", "), isOpen: b.isOpen, logoUrl: b.logoUrl, bannerUrl: b.bannerUrl,
        } : null}
      />
    </div>
  );
}
