// src/app/(auth)/register/supplier/page.tsx
// SUPPLIER REGISTRATION — Serious onboarding. Not a student flow.
// Requires: Business reg, KRA PIN, physical address, references, tier selection.
// After submit → PENDING verification. Admin reviews before activation.

"use client";

import { useState } from "react";
import { Building2, CheckCircle, ChevronRight, FileText, MapPin, Phone } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

export default function SupplierRegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [tier, setTier] = useState<"CAMPUS" | "REGIONAL" | "NATIONAL">("CAMPUS");

  const TIERS = [
    {
      id: "CAMPUS" as const,
      label: "Campus Supplier",
      price: "KES 2,000/mo",
      onboarding: "KES 5,000 once",
      coverage: "One campus or town",
      desc: "Best for local suppliers serving a specific campus area",
    },
    {
      id: "REGIONAL" as const,
      label: "Regional Supplier",
      price: "KES 6,000/mo",
      onboarding: "KES 15,000 once",
      coverage: "Multiple campuses in a region",
      desc: "For suppliers who can serve several campuses within a region",
    },
    {
      id: "NATIONAL" as const,
      label: "National Supplier",
      price: "KES 15,000/mo",
      onboarding: "KES 40,000 once",
      coverage: "All campuses nationwide",
      desc: "For established suppliers ready to serve the entire network",
    },
  ];

  async function handleSubmit() {
    setIsLoading(true);
    // TODO: POST /api/auth/register/supplier
    // Creates account with verificationStatus: PENDING
    // Admin receives notification to review
    // Supplier receives email: "Your application is under review. We'll respond within 48 hours."
    setIsLoading(false);
  }

  return (
    <div className="w-full max-w-xl">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Supplier Application</h1>
            <p className="text-xs text-muted-foreground">Step {step} of 4</p>
          </div>
        </div>

        {/* ─── STEP 1: Tier Selection ─────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="font-semibold mb-1">Choose your supplier tier</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Select based on how many campuses you can realistically serve with consistent quality and delivery.
            </p>
            <div className="space-y-3">
              {TIERS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTier(t.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all
                    ${tier === t.id ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm">{t.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.coverage}</div>
                      <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-bold text-primary">{t.price}</div>
                      <div className="text-xs text-muted-foreground">{t.onboarding}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Note:</strong> A 3% transaction fee applies on every order placed through the platform. Annual contracts receive a 15% discount on monthly fees.
            </div>
            <button onClick={() => setStep(2)} className="mt-6 w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── STEP 2: Business Details ────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="font-semibold mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Business Information
            </h2>
            <div className="space-y-4">
              {[
                { label: "Business / Company Name", name: "businessName", placeholder: "Karibu Wholesale Ltd" },
                { label: "Business Registration Number", name: "regNo", placeholder: "BN/2021/123456" },
                { label: "KRA PIN", name: "kraPin", placeholder: "P051234567X" },
                { label: "Contact Person Name", name: "contactName", placeholder: "John Kamau" },
                { label: "Business Email", name: "email", placeholder: "info@karibuwholesale.co.ke" },
                { label: "Contact Phone", name: "phone", placeholder: "0712345678" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="text-sm font-medium block mb-1.5">{f.label}</label>
                  <input
                    type="text"
                    name={f.name}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
            <button onClick={() => setStep(3)} className="mt-6 w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── STEP 3: Address & Coverage ──────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="font-semibold mb-6 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Location & Coverage
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Physical Business Address</label>
                <textarea
                  rows={2}
                  placeholder="Building name, Street, Town, County"
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Products / Services Category</label>
                <select className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>Food & Groceries</option>
                  <option>Stationery & Office</option>
                  <option>Electronics & Tech</option>
                  <option>Clothing & Fashion</option>
                  <option>Beauty & Cosmetics</option>
                  <option>Printing & Branding</option>
                  <option>Construction & Hardware</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Business References (3 required)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Provide 3 existing business clients we can contact to verify your reliability.
                </p>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={`Reference ${i} name`}
                      className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(4)} className="mt-6 w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── STEP 4: Agreement & Submit ──────────────────── */}
        {step === 4 && (
          <div>
            <h2 className="font-semibold mb-6 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" /> Supplier Agreement
            </h2>
            <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-2 mb-6 max-h-48 overflow-y-auto">
              <p className="font-semibold text-foreground text-sm">By submitting, you agree that:</p>
              <p>1. All information provided is truthful and verifiable.</p>
              <p>2. Prices listed will be locked for a minimum of 30 days after listing.</p>
              <p>3. Orders must be fulfilled within the stated lead time or the platform may issue a strike.</p>
              <p>4. All communication with student buyers happens through the platform — no private contact sharing.</p>
              <p>5. Payment is held in escrow and released only upon confirmed delivery.</p>
              <p>6. Three strikes result in permanent removal with no refund of fees paid.</p>
              <p>7. The platform reserves the right to audit product quality at any time.</p>
              <p>8. Monthly fees are due on the 1st of each month. Non-payment suspends your account within 7 days.</p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Set Account Password</label>
              <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-3" />
              <input type="password" placeholder="Confirm password" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <CheckCircle className="w-4 h-4" />
              }
              {isLoading ? "Submitting application..." : "Submit Application"}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Applications are reviewed within 48 hours. You&apos;ll receive an email on approval.
            </p>
          </div>
        )}
      </div>

      {step > 1 && (
        <button onClick={() => setStep((s) => (s - 1) as Step)} className="mt-4 text-sm text-muted-foreground hover:text-foreground mx-auto block transition-colors">
          ← Back
        </button>
      )}
    </div>
  );
}
