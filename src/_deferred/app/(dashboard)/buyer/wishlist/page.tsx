// Route: /buyer/wishlist
// Saved products and businesses for later purchase
// TODO: GET /api/buyer/wishlist. DELETE /api/buyer/wishlist/:id. Quick add-to-cart from wishlist.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Wishlist</h1>
        <p className="text-sm text-muted-foreground">Saved products and businesses for later purchase</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: GET /api/buyer/wishlist. DELETE /api/buyer/wishlist/:id. Quick add-to-cart from wishlist.</p>
      </div>
    </div>
  );
}
