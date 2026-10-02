// Route: /seller/education
// Micro-lessons, business challenges, mentor matching, comrade success stories
// TODO: Fetch lessons from GET /api/education/lessons. Track progress via POST /api/education/progress. Challenge leaderboard from GET /api/challenges/leaderboard.

"use client";
import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Business Education</h1>
        <p className="text-sm text-muted-foreground">Micro-lessons, business challenges, mentor matching, comrade success stories</p>
      </div>
      <div className="stat-card border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-semibold text-muted-foreground">Ready to build</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">TODO: Fetch lessons from GET /api/education/lessons. Track progress via POST /api/education/progress. Challenge leaderboard from GET /api/challenges/leaderboard.</p>
      </div>
    </div>
  );
}
