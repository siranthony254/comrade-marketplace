// src/app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiActiveStudent, apiUser } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

// Same fix as the posts routes: no auth check, plus author.user.email included and never
// rendered (the frontend only shows fullName) — dropped for the same reasons.
const COMMENT_AUTHOR_SELECT = {
  select: {
    id: true,
    fullName: true,
    school: { select: { name: true, shortName: true } },
  },
} as const;

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// GET /api/posts/[id]/comments - Get comments for a post. Requires sign-in.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await apiUser();

    const comments = await prisma.comment.findMany({
      where: {
        postId: params.id,
        parentId: null, // Only top-level comments
      },
      include: {
        author: COMMENT_AUTHOR_SELECT,
        replies: {
          take: 20,
          include: { author: COMMENT_AUTHOR_SELECT },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      relationLoadStrategy: "join",
    });

    return NextResponse.json({ comments });
  } catch (error) {
    return errorResponse(error, "Failed to fetch comments");
  }
}

// POST /api/posts/[id]/comments - Create a comment
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await apiActiveStudent();
    const body = await req.json();

    const validated = createCommentSchema.parse(body);

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // If parentId is provided, verify it exists and belongs to this post
    if (validated.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validated.parentId },
        select: { postId: true },
      });
      if (!parentComment || parentComment.postId !== params.id) {
        return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId: params.id,
        authorId: profile.id,
        content: validated.content,
        parentId: validated.parentId,
      },
      include: { author: COMMENT_AUTHOR_SELECT },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return errorResponse(error, "Failed to create comment");
  }
}
