// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiActiveStudent, apiUser } from "@/lib/session";
import { ApiError } from "@/lib/api";

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// GET /api/posts/[id] - Get a single post. Requires sign-in — not a public endpoint.
//
// The previous version fetched EVERY like (with the liker's email), EVERY comment with its
// full reply tree (each with the author's email), and EVERY share, unbounded — both an
// unauthenticated email leak and, for any post that caught on, a query over an ever-growing
// amount of data. Comments already have their own paginated endpoint
// (/api/posts/[id]/comments) that the frontend actually uses; this route now returns counts
// plus a small bounded list of recent likers (the common "liked by X, Y and 12 others"
// pattern), not full unbounded relations.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await apiUser();

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            school: { select: { name: true, shortName: true } },
            business: { select: { name: true, slug: true, logoUrl: true } },
          },
        },
        business: { select: { name: true, slug: true, logoUrl: true } },
        likes: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { user: { select: { id: true, fullName: true } } },
        },
        _count: { select: { likes: true, comments: true, shares: true } },
      },
      relationLoadStrategy: "join",
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    return errorResponse(error, "Failed to fetch post");
  }
}

// DELETE /api/posts/[id] - Delete a post (only by author)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await apiActiveStudent();

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
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
    return errorResponse(error, "Failed to delete post");
  }
}
