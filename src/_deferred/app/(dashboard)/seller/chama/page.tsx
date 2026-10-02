// Route: /seller/chama
// Join or create digital savings groups. Contribute weekly, receive pot in rotation.
// TODO: GET /api/chamas?schoolId=. Create: POST /api/chamas. Join: POST /api/chamas/:id/join. Contributions logged as Transaction type CHAMA_CONTRIBUTION.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Chama Groups</h1>
        <p className="text-sm text-muted-foreground">Join or create digital savings groups. Contribute weekly, receive pot in rotation.</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: GET /api/chamas?schoolId=. Create: POST /api/chamas. Join: POST /api/chamas/:id/join. Contributions logged as Transaction type CHAMA_CONTRIBUTION.</p>
      </div>
    </div>
  );
}
