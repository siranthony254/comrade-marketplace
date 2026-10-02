// src/app/share/[shareId]/page.tsx - Shared post page
//
// generateMetadata() below is the actual feature: when this link is pasted into WhatsApp,
// Twitter, or anywhere else that unfurls links, the post's own image (or its link preview
// image) is what shows up, not a generic site card. That's the "posts with images should
// carry the image along" requirement — it didn't exist before this file had a
// generateMetadata export at all.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostFeed from "@/components/PostFeed";

// Matches on the shareId suffix, not the full stored URL. Share.shareUrl is built from
// NEXT_PUBLIC_APP_URL at creation time; matching the exact string would silently break any
// link created before that env var changed, or shared from a different hostname than it's
// currently set to (this app is reachable at more than one). The shareId itself is a random
// UUID, so matching by suffix alone is still effectively unique.
async function loadShare(shareId: string) {
  return prisma.share.findFirst({
    where: { shareUrl: { endsWith: `/share/${shareId}` } },
    include: {
      post: {
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
          _count: { select: { likes: true, comments: true, shares: true } },
        },
      },
    },
    relationLoadStrategy: "join",
  });
}

export async function generateMetadata({ params }: { params: { shareId: string } }): Promise<Metadata> {
  const share = await loadShare(params.shareId);
  if (!share?.post) return { title: "Post not found" };

  const post = share.post;
  const title = `${post.author.fullName} on Comrade Market`;
  const description = post.content.length > 160 ? `${post.content.slice(0, 157)}...` : post.content;
  // Prefer the post's own photo; fall back to its link preview image if it's a link share.
  const image = post.images[0] ?? post.linkImage ?? undefined;

  return {
    title,
    description,
    openGraph: { title, description, type: "article", images: image ? [{ url: image }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function SharedPostPage({ params }: { params: { shareId: string } }) {
  const share = await loadShare(params.shareId);
  if (!share?.post) notFound();

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
