// src/app/(dashboard)/seller/savings/page.tsx
// SAVINGS & CHAMA — savings goals, wallet, auto-save settings
// Route: /seller/savings

"use client";

import { useState } from "react";
import { PiggyBank, Plus, Target, TrendingUp, Settings } from "lucide-react";

const MOCK_GOALS = [
  { id: "1", name: "New blender", target: 15000, current: 3200, autoSave: 10, deadline: "2024-09-01" },
  { id: "2", name: "Bulk ingredients stock", target: 8000, current: 8000, autoSave: 0, deadline: null },
];

export default function SellerSavingsPage() {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const walletBalance = 3200;
  const totalSavings = MOCK_GOALS.reduce((s, g) => s + g.current, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Savings & Goals</h1>

      {/* Wallet overview */}
      <div className="comrade-gradient rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <PiggyBank className="w-5 h-5" />
          <span className="text-sm font-medium text-white/80">Savings Wallet</span>
        </div>
        <div className="font-display text-3xl font-bold">KES {totalSavings.toLocaleString()}</div>
        <p className="text-white/70 text-sm mt-1">Automatically growing with every sale</p>
        <div className="mt-4 flex gap-2">
          <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            Withdraw to M-Pesa
            {/* TODO: POST /api/seller/savings/withdraw */}
          </button>
          <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" /> Auto-save settings
          </button>
        </div>
      </div>

      {/* Goals */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Savings Goals</h2>
        <button
          onClick={() => setShowGoalForm(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      <div className="space-y-4">
        {MOCK_GOALS.map((goal) => {
          const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
          const completed = goal.current >= goal.target;
          return (
            <div key={goal.id} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className={`w-5 h-5 ${completed ? "text-green-600" : "text-primary"}`} />
                  <div>
                    <p className="font-semibold text-sm">{goal.name}</p>
                    {goal.autoSave > 0 && (
                      <p className="text-xs text-muted-foreground">{goal.autoSave}% of each sale auto-saved</p>
                    )}
                  </div>
                </div>
                {completed && (
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ✓ Goal reached!
                  </span>
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>KES {goal.current.toLocaleString()} saved</span>
                <span>KES {goal.target.toLocaleString()} goal</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${completed ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {pct}% complete
                {goal.deadline && !completed && ` · Target date: ${new Date(goal.deadline).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Auto-save explanation */}
      <div className="stat-card border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">How auto-save works</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Set a percentage and every time a sale is completed and escrow releases your money, that percentage is automatically moved to your savings wallet before the rest hits your main balance. You build savings without even thinking about it.
            </p>
          </div>
        </div>
      </div>

      {/* Goal Form Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-display text-lg font-bold mb-4">New Savings Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">What are you saving for?</label>
                <input type="text" placeholder="e.g. New blender, Stock, Laptop" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Target Amount (KES)</label>
                <input type="number" placeholder="15000" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Auto-save % per sale</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={50} defaultValue={10} className="flex-1 accent-primary" />
                  <span className="text-sm font-medium w-8">10%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Set to 0 to save manually</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Target Date (optional)</label>
                <input type="date" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowGoalForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                Create Goal
                {/* TODO: POST /api/seller/savings/goals */}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
