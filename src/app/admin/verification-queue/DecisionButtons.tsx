"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/client-api";
import { btnDanger, btnPrimary, inputCls } from "@/lib/ui";

const REASONS = ["Photo is blurry or unreadable", "ID number doesn't match", "Selfie doesn't match the ID", "ID is expired or not a student ID", "School doesn't match the ID"];

export function DecisionButtons({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decide(body: object) {
    setBusy(true);
    setError("");
    try { await api(`/api/admin/verification/${profileId}/decision`, { json: body }); router.refresh(); } catch (e) { setError(errorMessage(e)); setBusy(false); }
  }

  return (
    <div className="space-y-2">
      {!rejecting ? (
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => decide({ decision: "APPROVE" })} className={`${btnPrimary} flex-1`}>Approve</button>
          <button disabled={busy} onClick={() => setRejecting(true)} className={`${btnDanger} flex-1`}>Reject…</button>
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-800">The student gets this reason by SMS, and their photos are deleted so they can sign up again.</p>
          <select value={REASONS.includes(note) ? note : ""} onChange={(e) => setNote(e.target.value)} className={inputCls}><option value="">Pick a reason…</option>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="…or write your own" className={inputCls} />
          <div className="flex gap-2"><button onClick={() => setRejecting(false)} className="flex-1 border border-border rounded-lg py-2 text-sm">Back</button><button disabled={busy || note.trim().length < 3} onClick={() => decide({ decision: "REJECT", note })} className={`${btnDanger} flex-1`}>Confirm reject</button></div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
