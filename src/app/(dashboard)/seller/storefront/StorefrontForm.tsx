"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, ImagePlus, Share2 } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import { BUSINESS_CATEGORIES } from "@/lib/constants/platform";
import { makeSlug } from "@/lib/validations";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

interface Initial { name: string; slug: string; tagline: string; description: string; category: string; whatsappNumber: string; acceptsDelivery: boolean; deliveryAreas: string; isOpen: boolean; logoUrl: string | null; bannerUrl: string | null }

const BLANK: Initial = { name: "", slug: "", tagline: "", description: "", category: BUSINESS_CATEGORIES[0], whatsappNumber: "", acceptsDelivery: false, deliveryAreas: "", isOpen: true, logoUrl: null, bannerUrl: null };

export function StorefrontForm({ initial, baseUrl, canEdit }: { initial: Initial | null; baseUrl: string; canEdit: boolean }) {
  const router = useRouter();
  const creating = !initial;
  const [f, setF] = useState<Initial>(initial ?? BLANK);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof Initial>(k: K, v: Initial[K]) => { setSaved(false); setF((p) => ({ ...p, [k]: v })); };
  const url = `${baseUrl.replace(/\/$/, "")}/${f.slug}`;

  async function upload(kind: "logo" | "banner", file: File | undefined) {
    if (!file) return;
    setError("");
    setUploading(kind);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const r = await api<{ url: string }>("/api/uploads/image", { form });
      set(kind === "logo" ? "logoUrl" : "bannerUrl", r.url);
    } catch (e) { setError(errorMessage(e)); } finally { setUploading(null); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/seller/business", {
        method: "PUT",
        json: {
          name: f.name, slug: f.slug, tagline: f.tagline || null, description: f.description || null, category: f.category,
          whatsappNumber: f.whatsappNumber || null, acceptsDelivery: f.acceptsDelivery,
          deliveryAreas: f.deliveryAreas.split(",").map((s) => s.trim()).filter(Boolean),
          isOpen: f.isOpen, logoUrl: f.logoUrl, bannerUrl: f.bannerUrl,
        },
      });
      setSaved(true);
      router.refresh();
      if (creating) router.push("/seller/products");
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      {!canEdit && <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3">You can fill this in once your student ID is approved.</p>}

      {!creating && (
        <div className="stat-card flex flex-col sm:flex-row gap-4 items-center">
          <QRCodeSVG value={url} size={96} />
          <div className="flex-1 min-w-0 w-full">
            <p className="text-xs text-muted-foreground mb-1">Your link — put it in your WhatsApp status and bio</p>
            <p className="font-mono text-sm break-all">{url}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button type="button" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={btnSecondary}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? "Copied" : "Copy link"}</button>
              <a href={`https://wa.me/?text=${encodeURIComponent(`Check out ${f.name} on Comrade Market: ${url}`)}`} target="_blank" rel="noopener noreferrer" className={btnSecondary}><Share2 className="w-4 h-4" />Share on WhatsApp</a>
              <Link href={`/${f.slug}`} target="_blank" className={btnSecondary}>Preview</Link>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={save} className="stat-card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {(["logo", "banner"] as const).map((kind) => {
            const val = kind === "logo" ? f.logoUrl : f.bannerUrl;
            return (
              <div key={kind}>
                <label className={labelCls}>{kind === "logo" ? "Logo" : "Banner"} (optional)</label>
                <label className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary overflow-hidden text-xs text-muted-foreground">
                  {val ? <img src={val} alt="" className="w-full h-full object-cover" /> : uploading === kind ? "Uploading…" : <span className="flex items-center gap-1"><ImagePlus className="w-4 h-4" />Add {kind}</span>}
                  <input type="file" accept="image/*" disabled={!canEdit} className="hidden" onChange={(e) => upload(kind, e.target.files?.[0])} />
                </label>
              </div>
            );
          })}
        </div>

        <div>
          <label className={labelCls}>Business name</label>
          <input required value={f.name} disabled={!canEdit} onChange={(e) => { set("name", e.target.value); if (creating && !slugTouched) set("slug", makeSlug(e.target.value)); }} className={inputCls} placeholder="Jane's Kitchen" />
        </div>

        <div>
          <label className={labelCls}>Web address</label>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">{baseUrl.replace(/^https?:\/\//, "")}/</span>
            <input required disabled={!creating || !canEdit} value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", makeSlug(e.target.value)); }} className={inputCls} placeholder="janes-kitchen" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{creating ? "Choose carefully — you can't change this later, because it would break the links you've already shared." : "Your web address is permanent."}</p>
        </div>

        <div><label className={labelCls}>One-line description</label><input maxLength={120} value={f.tagline} disabled={!canEdit} onChange={(e) => set("tagline", e.target.value)} className={inputCls} placeholder="Hot meals delivered to your hostel" /></div>
        <div><label className={labelCls}>About your business</label><textarea rows={4} maxLength={800} value={f.description} disabled={!canEdit} onChange={(e) => set("description", e.target.value)} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Category</label>
          <select value={f.category} disabled={!canEdit} onChange={(e) => set("category", e.target.value)} className={inputCls}>{BUSINESS_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div><label className={labelCls}>WhatsApp number (for customer questions)</label><input type="tel" value={f.whatsappNumber} disabled={!canEdit} onChange={(e) => set("whatsappNumber", e.target.value)} className={inputCls} placeholder="0712 345 678" /></div>

        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.acceptsDelivery} disabled={!canEdit} onChange={(e) => set("acceptsDelivery", e.target.checked)} /> I deliver</label>
        {f.acceptsDelivery && <div><label className={labelCls}>Where do you deliver? (comma separated)</label><input value={f.deliveryAreas} disabled={!canEdit} onChange={(e) => set("deliveryAreas", e.target.value)} className={inputCls} placeholder="Hostels A–D, Main campus" /></div>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isOpen} disabled={!canEdit} onChange={(e) => set("isOpen", e.target.checked)} /> I&apos;m taking orders right now</label>

        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        {saved && <p className="text-sm text-green-700">Saved ✓</p>}
        <button disabled={busy || !canEdit || !f.name || !f.slug} className={`${btnPrimary} w-full`}>{busy ? "Saving…" : creating ? "Create my storefront" : "Save changes"}</button>
      </form>
    </div>
  );
}
