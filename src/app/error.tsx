"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-xl font-bold mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mb-6">It&apos;s on our side. Please try again.</p>
      <button onClick={reset} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold">Try again</button>
    </div>
  );
}
