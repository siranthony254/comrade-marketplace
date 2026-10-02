// Minimal public page chrome (nav + footer) for static/info pages.

import Link from "next/link";

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="h-14 flex items-center px-4 sm:px-6 border-b border-border">
        <Link href="/" className="font-display font-bold text-lg text-primary">Comrade<span className="text-secondary">Market</span></Link>
      </nav>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-6">{title}</h1>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_h2]:font-display [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_a]:text-primary [&_a]:underline">{children}</div>
      </main>
    </div>
  );
}

export function DraftNotice() {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-xs">
      <strong>Draft.</strong> This is placeholder text so the links work during development. Have a Kenyan lawyer review and replace it before you launch
      (it must cover the Data Protection Act 2019, ID-photo handling, escrow and refunds).
    </p>
  );
}
