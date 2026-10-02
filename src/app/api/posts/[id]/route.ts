// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiActiveStudent } from "@/lib/session";

// GET /api/posts/[id] - Get a single post
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: {
          include: {
            user: { select: { id: true, email: true } },
            school: { select: { name: true, shortName: true } },
            business: { select: { name: true, slug: true, logoUrl: true } },
          },
        },
        business: { select: { name: true, slug: true, logoUrl: true } },
        likes: {
          include: {
            user: {
              include: {
                user: { select: { id: true, email: true } },
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              include: {
                user: { select: { id: true, email: true } },
                school: { select: { name: true, shortName: true } },
              },
            },
            replies: {
              include: {
                author: {
                  include: {
                    user: { select: { id: true, email: true } },
                    school: { select: { name: true, shortName: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        shares: {
          include: {
            sharedBy: {
              include: {
                user: { select: { id: true, email: true } },
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[GET /api/posts/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

// DELETE /api/posts/[id] - Delete a post (only by author)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await apiActiveStudent();

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== profile.id) {
      return NextResponse.json({ error: "You can only delete your own posts" }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/posts/[id]]", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
