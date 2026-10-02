// src/app/share/[shareId]/page.tsx - Shared post page
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostFeed from "@/components/PostFeed";

export default async function SharedPostPage({ params }: { params: { shareId: string } }) {
  // Find the share record
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const share = await prisma.share.findFirst({
    where: { shareUrl: `${appUrl}/share/${params.shareId}` },
    include: {
      post: {
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
      },
    },
  });

  if (!share || !share.post) {
    notFound();
  }

  // Convert Date to string for client component
  const serializedPost = {
    ...share.post,
    createdAt: share.post.createdAt.toISOString(),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Shared Post</h1>
        <PostFeed posts={[serializedPost]} />
      </div>
    </div>
  );
}
