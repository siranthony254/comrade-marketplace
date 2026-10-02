// src/app/(auth)/layout.tsx
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <nav className="h-14 flex items-center px-6 border-b border-border bg-background">
        <Link href="/" className="font-display font-bold text-lg text-primary">
          Comrade<span className="text-secondary">Market</span>
        </Link>
      </nav>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
