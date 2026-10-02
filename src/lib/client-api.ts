// src/lib/client-api.ts — browser-side fetch wrapper for our own API routes.
// Resolves with the parsed JSON on success; throws an Error whose message is safe to show the user.

export async function api<T = Record<string, unknown>>(
  path: string,
  opts: { method?: string; json?: unknown; form?: FormData } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? (opts.json || opts.form ? "POST" : "GET"),
      headers: opts.json ? { "Content-Type": "application/json" } : undefined,
      body: opts.form ?? (opts.json ? JSON.stringify(opts.json) : undefined),
    });
  } catch {
    throw new Error("You seem to be offline. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Something went wrong. Please try again.");
  return data as T;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}
