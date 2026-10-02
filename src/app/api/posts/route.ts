// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiActiveStudent, apiUser } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { savePublicImage } from "@/lib/storage";
import { z } from "zod";

const createPostSchema = z.object({
  type: z.enum(["STOCK_UPDATE", "NEED_ITEM", "GENERAL", "PROMO"]).default("GENERAL"),
  content: z.string().min(1).max(5000),
  images: z.array(z.string().url()).max(5).optional(),
  linkUrl: z.string().url().optional(),
  linkTitle: z.string().max(200).optional(),
  linkDescription: z.string().max(500).optional(),
  linkImage: z.string().url().optional(),
  businessId: z.string().optional(),
});

// The feed is for the campus community, not the public internet — same boundary every other
// page in this app respects. `author.user` (id + email) used to be included here too, even
// though no current frontend renders it — meaning every post leaked its author's email to
// anyone who could reach this endpoint, which (until the GET auth check below) was anyone at
// all. Dropped entirely rather than fetched-then-ignored; that also cuts a round trip.
const POST_LIST_INCLUDE = {
  author: {
    select: {
      id: true,
      fullName: true,
      school: { select: { name: true, shortName: true } },
      business: { select: { name: true, slug: true, logoUrl: true } },
    },
  },
  business: { select: { name: true, slug: true, logoUrl: true } },
  _count: { select: { likes: true, comments: true, shares: true } },
} satisfies Prisma.PostInclude;

const MAX_LIMIT = 50;
const POST_TYPES = ["STOCK_UPDATE", "NEED_ITEM", "GENERAL", "PROMO"] as const;

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// GET /api/posts - List posts (feed). Requires sign-in (any status) — not a public endpoint.
export async function GET(req: NextRequest) {
  try {
    await apiUser();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), MAX_LIMIT);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
    const typeParam = searchParams.get("type");
    const type = (POST_TYPES as readonly string[]).includes(typeParam ?? "") ? (typeParam as (typeof POST_TYPES)[number]) : undefined;

    const posts = await prisma.post.findMany({
      where: type ? { type } : {},
      include: POST_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      // One SQL query with LEFT JOINs instead of ~5-6 sequential round trips — measured at
      // 8-15s per request without this against this app's database (see schema.prisma's
      // generator block for why this needs a preview feature at all).
      relationLoadStrategy: "join",
    });

    return NextResponse.json({ posts });
  } catch (error) {
    return errorResponse(error, "Failed to fetch posts");
  }
}

// POST /api/posts - Create a new post
export async function POST(req: NextRequest) {
  try {
    const { profile } = await apiActiveStudent();
    const formData = await req.formData();

    const content = formData.get("content") as string;
    const type = (formData.get("type") as string) || "GENERAL";
    const businessId = formData.get("businessId") as string | null;
    const linkUrl = formData.get("linkUrl") as string | null;
    const linkTitle = formData.get("linkTitle") as string | null;
    const linkDescription = formData.get("linkDescription") as string | null;
    const linkImage = formData.get("linkImage") as string | null;

    // Handle image uploads
    const images: string[] = [];
    const imageFiles = formData.getAll("images") as File[];
    for (const file of imageFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await savePublicImage(buffer, 1200);
        images.push(url);
      }
    }

    // Validate input
    const validated = createPostSchema.parse({
      type,
      content,
      images,
      linkUrl: linkUrl || undefined,
      linkTitle: linkTitle || undefined,
      linkDescription: linkDescription || undefined,
      linkImage: linkImage || undefined,
      businessId: businessId || undefined,
    });

    // If businessId is provided, verify it belongs to the user
    if (validated.businessId) {
      const business = await prisma.business.findUnique({
        where: { id: validated.businessId },
      });
      if (!business || business.ownerId !== profile.id) {
        return NextResponse.json({ error: "Invalid business" }, { status: 400 });
      }
    }

    const post = await prisma.post.create({
      data: {
        authorId: profile.id,
        businessId: validated.businessId,
        type: validated.type,
        content: validated.content,
        images: validated.images || [],
        linkUrl: validated.linkUrl,
        linkTitle: validated.linkTitle,
        linkDescription: validated.linkDescription,
        linkImage: validated.linkImage,
      },
      include: POST_LIST_INCLUDE,
      relationLoadStrategy: "join",
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return errorResponse(error, "Failed to create post");
  }
}
