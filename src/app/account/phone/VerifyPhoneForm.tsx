"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle, ShieldCheck } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import { btnPrimary, inputCls, labelCls } from "@/lib/ui";

export function VerifyPhoneForm({ phone, alreadyVerified }: { phone: string; alreadyVerified: boolean }) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(alreadyVerified);

  async function sendCode() {
    setError("");
    setBusy(true);
    try {
      const r = await api<{ devCode?: string }>("/api/account/phone/send", { method: "POST" });
      setSent(true);
      setDevCode(r.devCode ?? "");
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  async function confirm() {
    setError("");
    setBusy(true);
    try {
      await api("/api/account/phone/confirm", { json: { code } });
      setDone(true);
      router.refresh();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm text-center">
        {done ? (
          <>
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h1 className="font-display text-xl font-bold mb-1">Phone verified</h1>
            <p className="text-sm text-muted-foreground">{phone} is confirmed on your account.</p>
          </>
        ) : (
          <>
            <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="font-display text-xl font-bold mb-1">Verify your phone</h1>
            <p className="text-sm text-muted-foreground mb-6">Confirm you own <strong>{phone}</strong> — this is optional, but it&apos;s the number M-Pesa prompts and payouts use, so it&apos;s worth doing.</p>

            {!sent ? (
              <button onClick={sendCode} disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Sending…" : "Send me a code"}</button>
            ) : (
              <div className="text-left space-y-3">
                <div>
                  <label className={labelCls}>6-digit code sent to {phone}</label>
                  <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" className={inputCls} placeholder="123456" />
                  {devCode && <p className="text-xs mt-1 text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">Dev mode (no SMS provider): your code is <strong>{devCode}</strong></p>}
                </div>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <button onClick={confirm} disabled={busy || !/^\d{6}$/.test(code)} className={`${btnPrimary} w-full`}>{busy ? "Checking…" : "Confirm"}</button>
                <button onClick={sendCode} disabled={busy} className="text-xs text-muted-foreground hover:text-foreground mx-auto block">Resend code</button>
              </div>
            )}
            {!sent && error && <p role="alert" className="text-sm text-red-600 mt-3">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
