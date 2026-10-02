// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiActiveStudent } from "@/lib/session";
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

// GET /api/posts - List posts (feed)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");

    const where = type ? { type: type as any } : {};

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          include: {
            user: { select: { id: true, email: true } },
            school: { select: { name: true, shortName: true } },
            business: { select: { name: true, slug: true, logoUrl: true } },
          },
        },
        business: { select: { name: true, slug: true, logoUrl: true } },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
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
      include: {
        author: {
          include: {
            user: { select: { id: true, email: true } },
            school: { select: { name: true, shortName: true } },
            business: { select: { name: true, slug: true, logoUrl: true } },
          },
        },
        business: { select: { name: true, slug: true, logoUrl: true } },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/posts]", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
