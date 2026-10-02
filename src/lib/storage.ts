// src/lib/storage.ts
// File storage with two drivers, chosen by env:
//   cloudinary — when CLOUDINARY_* are set (production)
//   local      — otherwise (development): private files in .private-uploads/, public in public/uploads/
//
// PRIVATE files (student ID photos, selfies, dispute evidence) are addressed by an opaque
// key and can only be read back through an admin-authenticated route. They are never given a public URL.
// Every image is re-encoded through sharp: this validates that it really is an image,
// strips EXIF (GPS location!) and caps the dimensions.

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "@/lib/api";
import { PLATFORM } from "@/lib/constants/platform";

const useCloudinary = Boolean(
  process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const PRIVATE_ROOT = path.join(process.cwd(), ".private-uploads");
const PUBLIC_ROOT = path.join(process.cwd(), "public", "uploads");
const PRIVATE_KEY_RE = /^[a-z-]{1,30}\/[a-f0-9-]{36}$/;

export type PrivateKind = "student-id" | "selfie" | "evidence";

/**
 * The local filesystem fallback only works when the process has a writable, persistent
 * `process.cwd()` — true in dev, false on Vercel (and most serverless hosts), whose functions
 * have a read-only filesystem outside /tmp. Without this guard, a misconfigured production
 * deploy wouldn't crash loudly: it would either throw an opaque EROFS/ENOENT deep in `fs`, or
 * (worse) "succeed" into a directory that's wiped between invocations, silently losing ID
 * photos. Fail clearly instead, the same way payments/index.ts and sms.ts refuse to run
 * their dev-only fallbacks in production.
 */
function assertStorageConfigured(): void {
  if (!useCloudinary && process.env.NODE_ENV === "production") {
    throw new Error(
      "Image storage is not configured for production. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET — the local filesystem fallback cannot work " +
        "on Vercel's read-only filesystem.",
    );
  }
}

/** Validate + normalise an uploaded image. Throws ApiError(400) for anything that isn't a real image. */
export async function processImage(input: Buffer, maxDim: number): Promise<Buffer> {
  if (input.length > PLATFORM.limits.maxUploadBytes) {
    throw new ApiError(400, `Image is too large (max ${PLATFORM.limits.maxUploadBytes / 1024 / 1024}MB).`);
  }
  try {
    return await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate() // apply EXIF orientation, then drop the metadata
      .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ApiError(400, "That file isn't a valid image. Use a JPG or PNG photo.");
  }
}

function uploadToCloudinary(buffer: Buffer, options: Record<string, unknown>): Promise<{ public_id: string; secure_url: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (err, res) => (err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res)))
      .end(buffer);
  });
}

/** Store a private image; returns the opaque key to save in the database. */
export async function savePrivateImage(kind: PrivateKind, input: Buffer): Promise<string> {
  assertStorageConfigured();
  const image = await processImage(input, 1600);
  const id = randomUUID();
  if (useCloudinary) {
    const res = await uploadToCloudinary(image, { type: "private", folder: kind, public_id: id, resource_type: "image", format: "jpg" });
    return res.public_id; // "<kind>/<uuid>"
  }
  const key = `${kind}/${id}`;
  await fs.mkdir(path.join(PRIVATE_ROOT, kind), { recursive: true });
  await fs.writeFile(path.join(PRIVATE_ROOT, `${key}.jpg`), image);
  return key;
}

/** Read a private image back. Callers MUST have already authorised the request. */
export async function readPrivateImage(key: string): Promise<Buffer> {
  assertStorageConfigured();
  if (!PRIVATE_KEY_RE.test(key)) throw new ApiError(400, "Invalid file key."); // blocks path traversal
  if (useCloudinary) {
    const url = cloudinary.utils.private_download_url(key, "jpg", { type: "private", expires_at: Math.floor(Date.now() / 1000) + 60 });
    const res = await fetch(url);
    if (!res.ok) throw new ApiError(404, "File not found.");
    return Buffer.from(await res.arrayBuffer());
  }
  try {
    return await fs.readFile(path.join(PRIVATE_ROOT, `${key}.jpg`));
  } catch {
    throw new ApiError(404, "File not found.");
  }
}

/** Store a public image (logo, banner, product photo); returns its URL. */
export async function savePublicImage(input: Buffer, maxDim = 1200): Promise<string> {
  assertStorageConfigured();
  const image = await processImage(input, maxDim);
  const id = randomUUID();
  if (useCloudinary) {
    const res = await uploadToCloudinary(image, { folder: "comrade-market", public_id: id, resource_type: "image", format: "jpg" });
    return res.secure_url;
  }
  await fs.mkdir(PUBLIC_ROOT, { recursive: true });
  await fs.writeFile(path.join(PUBLIC_ROOT, `${id}.jpg`), image);
  return `/uploads/${id}.jpg`;
}

/** Permanently delete a private image (used when a signup is rejected — we don't keep ID photos we don't need). */
export async function deletePrivateImage(key: string): Promise<void> {
  assertStorageConfigured();
  if (!PRIVATE_KEY_RE.test(key)) return;
  if (useCloudinary) {
    await cloudinary.uploader.destroy(key, { type: "private", resource_type: "image" }).catch(() => undefined);
    return;
  }
  await fs.rm(path.join(PRIVATE_ROOT, `${key}.jpg`), { force: true });
}
