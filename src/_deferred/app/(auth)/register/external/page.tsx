// src/app/(auth)/register/external/page.tsx
// EXTERNAL CLIENT — Companies/individuals who want to hire student talent
// Simpler registration. Higher transaction fee (8-10%) applied at checkout.

"use client";

import { useState } from "react";
import { Briefcase, CheckCircle } from "lucide-react";

export default function ExternalRegisterPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    // TODO: POST /api/auth/register/external
    // Redirect to /client/browse on success
    setIsLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Hire Student Talent</h1>
            <p className="text-xs text-muted-foreground">Access Kenya&apos;s most motivated student professionals</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-6">
          <strong>How it works:</strong> Post a brief, receive bids from verified students, choose your comrade, pay securely via escrow. An 8–10% service fee applies per completed job.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Your Full Name", name: "contactName", type: "text", placeholder: "Jane Mwangi" },
            { label: "Company / Organisation (optional)", name: "companyName", type: "text", placeholder: "Acme Designs Ltd" },
            { label: "Business Email", name: "email", type: "email", placeholder: "jane@company.co.ke" },
            { label: "Phone Number", name: "phone", type: "tel", placeholder: "0712345678" },
          ].map((f) => (
            <div key={f.name}>
              <label className="text-sm font-medium block mb-1.5">{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                placeholder={f.placeholder}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}

          <div>
            <label className="text-sm font-medium block mb-1.5">Industry</label>
            <select className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option>Marketing & Advertising</option>
              <option>Tech & Software</option>
              <option>Media & Publishing</option>
              <option>NGO & Non-profit</option>
              <option>Finance & Banking</option>
              <option>Retail & E-commerce</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Password</label>
            <input type="password" name="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {isLoading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <CheckCircle className="w-4 h-4" />
            }
            {isLoading ? "Creating account..." : "Create Client Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
