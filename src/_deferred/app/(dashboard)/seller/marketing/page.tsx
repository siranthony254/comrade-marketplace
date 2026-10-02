// Route: /seller/marketing
// Promo card generator, flash sales, referral links, milestone cards, scheduled posts
// TODO: Integrate html2canvas for card generation. POST /api/seller/marketing/promo-card with template + product data. QR code via qrcode.react. WhatsApp share via wa.me deep link.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Marketing & Promotions</h1>
        <p className="text-sm text-muted-foreground">Promo card generator, flash sales, referral links, milestone cards, scheduled posts</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: Integrate html2canvas for card generation. POST /api/seller/marketing/promo-card with template + product data. QR code via qrcode.react. WhatsApp share via wa.me deep link.</p>
      </div>
    </div>
  );
}
