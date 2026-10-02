import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="font-display text-6xl font-bold text-primary mb-2">404</p>
      <h1 className="font-display text-xl font-bold mb-2">We couldn&apos;t find that page</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">The link may be wrong, or the business may have closed or changed its address.</p>
      <div className="flex gap-3">
        <Link href="/" className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold">Go home</Link>
        <Link href="/explore" className="border border-border px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-muted">Browse businesses</Link>
      </div>
    </div>
  );
}
