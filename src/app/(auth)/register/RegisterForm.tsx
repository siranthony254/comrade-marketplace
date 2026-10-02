"use client";

// 4 steps: mode -> details -> ID photos -> password.
// Verification is done by a human admin after signup. Nothing here decides "verified".
// No phone code at signup — that would make joining depend on an SMS provider being set up.
// Phone ownership can be verified afterwards, any time, at /account/phone.
// Photos use the phone's native camera via <input capture>, which is far more reliable on cheap
// Android phones than in-page getUserMedia.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { Camera, CheckCircle, ChevronRight, CreditCard } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import { btnPrimary, inputCls, labelCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

type School = { id: string; name: string; type: string };
type Step = 1 | 2 | 3 | 4;

export function RegisterForm({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [wantsToSell, setWantsToSell] = useState(false);
  const [f, setF] = useState({ fullName: "", email: "", phone: "", schoolId: "", studentIdNumber: "", courseOfStudy: "", yearOfStudy: "", password: "", confirm: "" });
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const idUrl = useMemo(() => (idPhoto ? URL.createObjectURL(idPhoto) : ""), [idPhoto]);
  const selfieUrl = useMemo(() => (selfie ? URL.createObjectURL(selfie) : ""), [selfie]);

  async function submit() {
    setError("");
    if (f.password !== f.confirm) return setError("Passwords don't match.");
    if (!idPhoto || !selfie) return setError("Please add both photos.");
    setBusy(true);
    try {
      const form = new FormData();
      for (const [k, v] of Object.entries({ ...f, wantsToSell: String(wantsToSell) })) if (k !== "confirm") form.append(k, v);
      form.append("idPhoto", idPhoto);
      form.append("selfie", selfie);
      const r = await api<{ next: string }>("/api/auth/register", { form });

      const res = await signIn("credentials", { identifier: f.email, password: f.password, redirect: false });
      if (res?.error) return router.push("/login");
      router.push(r.next);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  const detailsValid = f.fullName.trim().length >= 2 && /\S+@\S+\.\S+/.test(f.email) && f.phone.trim().length >= 9 && f.schoolId && f.studentIdNumber.trim().length >= 3;
  const STEPS = ["Mode", "Details", "Student ID", "Password"];

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-2 mb-6" aria-label={`Step ${step} of 4`}>
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
              i + 1 <= step ? "bg-primary text-white" : "bg-muted text-muted-foreground", i + 1 === step && "ring-4 ring-primary/20")}>
              {i + 1 < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1", i + 1 < step ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        {step === 1 && (
          <div>
            <h1 className="font-display text-2xl font-bold mb-2">Join Comrade Market</h1>
            <p className="text-sm text-muted-foreground mb-6">Are you here to buy, sell, or both? You can change this any time.</p>
            <div className="space-y-3">
              {[
                { sell: true, icon: "🏪", title: "I have a business", desc: "Get a free storefront, list what you sell, get paid safely" },
                { sell: false, icon: "🛒", title: "I just want to buy", desc: "Discover and safely buy from student businesses" },
              ].map((o) => (
                <button key={o.title} onClick={() => { setWantsToSell(o.sell); setStep(2); }}
                  className="w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary transition-colors">
                  <span className="text-3xl">{o.icon}</span>
                  <span><span className="block font-semibold">{o.title}</span><span className="block text-sm text-muted-foreground mt-0.5">{o.desc}</span></span>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center mt-6">Already a member? <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Tell us about yourself</h2>
            <div><label className={labelCls}>Full name (as on your student ID)</label><input value={f.fullName} onChange={set("fullName")} autoComplete="name" className={inputCls} placeholder="Jane Wanjiku" /></div>
            <div><label className={labelCls}>Email</label><input type="email" value={f.email} onChange={set("email")} autoComplete="email" className={inputCls} placeholder="jane@gmail.com" /></div>
            <div>
              <label className={labelCls}>M-Pesa phone number</label>
              <input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" className={inputCls} placeholder="0712 345 678" />
              <p className="text-xs text-muted-foreground mt-1">You can verify this number any time after joining, from your account settings.</p>
            </div>
            <div>
              <label className={labelCls}>Your school</label>
              <select value={f.schoolId} onChange={set("schoolId")} className={inputCls}>
                <option value="">Select your school…</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Student ID number</label><input value={f.studentIdNumber} onChange={set("studentIdNumber")} className={inputCls} placeholder="SCT221-0234/2022" /></div>
              <div>
                <label className={labelCls}>Year of study</label>
                <select value={f.yearOfStudy} onChange={set("yearOfStudy")} className={inputCls}>
                  <option value="">—</option>{[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button onClick={() => { setError(""); setStep(3); }} disabled={!detailsValid} className={`${btnPrimary} w-full`}>Continue <ChevronRight className="w-4 h-4" /></button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold mb-1">Verify you&apos;re a student</h2>
              <p className="text-sm text-muted-foreground">A real person checks your ID (usually within 24 hours). Your photos are stored privately, only used for this check, and deleted if we can&apos;t approve you.</p>
            </div>
            {[
              { label: "1. Photo of your student ID card", hint: "Both the photo and the number must be readable.", icon: CreditCard, file: idPhoto, url: idUrl, set: setIdPhoto, capture: "environment" as const },
              { label: "2. Selfie holding the ID next to your face", hint: "Good light, face clearly visible.", icon: Camera, file: selfie, url: selfieUrl, set: setSelfie, capture: "user" as const },
            ].map((p) => (
              <div key={p.label}>
                <label className={labelCls}>{p.label}</label>
                <label className={cn("flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors overflow-hidden", p.file ? "h-44" : "h-28")}>
                  {p.url ? <img src={p.url} alt="" className="w-full h-full object-cover" /> : (<><p.icon className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Tap to take or choose a photo</span></>)}
                  <input type="file" accept="image/*" capture={p.capture} className="hidden" onChange={(e) => p.set(e.target.files?.[0] ?? null)} />
                </label>
                <p className="text-xs text-muted-foreground mt-1">{p.hint}</p>
              </div>
            ))}
            <button onClick={() => setStep(4)} disabled={!idPhoto || !selfie} className={`${btnPrimary} w-full`}>Continue <ChevronRight className="w-4 h-4" /></button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Create your password</h2>
            <div><label className={labelCls}>Password</label><input type="password" value={f.password} onChange={set("password")} autoComplete="new-password" className={inputCls} placeholder="At least 8 characters" /></div>
            <div><label className={labelCls}>Confirm password</label><input type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" className={inputCls} /></div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              By joining you agree to use the platform for genuine business and to trade through it. Read our <Link href="/terms" className="text-primary underline">Terms</Link> and <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
            </p>
            {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <button onClick={submit} disabled={busy || f.password.length < 8 || f.password !== f.confirm} className={`${btnPrimary} w-full`}>
              <CheckCircle className="w-4 h-4" /> {busy ? "Creating your account…" : "Create my account"}
            </button>
          </div>
        )}
      </div>

      {step > 1 && <button onClick={() => { setError(""); setStep((s) => (s - 1) as Step); }} className="mt-4 text-sm text-muted-foreground hover:text-foreground mx-auto block">← Back</button>}
    </div>
  );
}
