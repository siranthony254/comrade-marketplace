// src/app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiActiveStudent } from "@/lib/session";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

// GET /api/posts/[id]/comments - Get comments for a post
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId: params.id,
        parentId: null, // Only top-level comments
      },
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
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("[GET /api/posts/[id]/comments]", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
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
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // If parentId is provided, verify it exists and belongs to this post
    if (validated.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validated.parentId },
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
      include: {
        author: {
          include: {
            user: { select: { id: true, email: true } },
            school: { select: { name: true, shortName: true } },
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/posts/[id]/comments]", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
