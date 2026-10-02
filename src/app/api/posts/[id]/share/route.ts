// src/app/api/posts/[id]/share/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiActiveStudent } from "@/lib/session";
import { randomUUID } from "node:crypto";

// POST /api/posts/[id]/share - Share a post
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await apiActiveStudent();

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user already shared this post
    const existingShare = await prisma.share.findFirst({
      where: {
        postId: params.id,
        sharedById: profile.id,
      },
    });

    if (existingShare) {
      return NextResponse.json({ share: existingShare, shareUrl: existingShare.shareUrl });
    }

    // Generate a unique share URL
    const shareId = randomUUID();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/share/${shareId}`;

    const share = await prisma.share.create({
      data: {
        postId: params.id,
        sharedById: profile.id,
        shareUrl,
      },
    });

    return NextResponse.json({ share, shareUrl });
  } catch (error) {
    console.error("[POST /api/posts/[id]/share]", error);
    return NextResponse.json({ error: "Failed to share post" }, { status: 500 });
  }
}
