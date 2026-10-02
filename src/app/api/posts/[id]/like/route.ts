// src/app/api/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiActiveStudent } from "@/lib/session";

// POST /api/posts/[id]/like - Like a post
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await apiActiveStudent();

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: profile.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return NextResponse.json({ liked: false });
    }

    // Like
    await prisma.like.create({
      data: {
        postId: params.id,
        userId: profile.id,
      },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("[POST /api/posts/[id]/like]", error);
    return NextResponse.json({ error: "Failed to like post" }, { status: 500 });
  }
}
