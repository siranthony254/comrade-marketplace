// src/lib/api.ts
// Uniform JSON error handling for route handlers.

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Handler = (req: Request, ctx: { params: Record<string, string> }) => Promise<Response>;

/** Wrap a route handler: ApiError -> its status, ZodError -> 400 with the first message, anything else -> 500 (logged, not leaked). */
export function handle(fn: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const where = first?.path?.length ? `${first.path.join(".")}: ` : "";
        return NextResponse.json({ ok: false, error: `${where}${first?.message ?? "Invalid input"}` }, { status: 400 });
      }
      console.error("[api] unhandled error", err);
      return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export const ok = <T extends object>(data: T = {} as T, init?: ResponseInit) =>
  NextResponse.json({ ok: true, ...data }, init);

/** Parse a JSON body, turning a malformed body into a 400 instead of a 500. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}
