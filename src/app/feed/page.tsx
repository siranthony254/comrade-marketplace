// src/app/feed/page.tsx - Social feed page
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import CreatePost from "@/components/CreatePost";
import PostFeed from "@/components/PostFeed";
import { prisma } from "@/lib/prisma";

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Fetch initial posts. See src/app/page.tsx's FeedPage for why author.user is left out and
  // relationLoadStrategy is set — same email-leak-via-RSC-payload fix, same slow-query fix.
  const posts = await prisma.post.findMany({
    where: {},
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
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    relationLoadStrategy: "join",
  });

  // Convert Date to string for client component
  const serializedPosts = posts.map(post => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Campus Feed</h1>
      <CreatePost />
      <PostFeed posts={serializedPosts} currentUserId={user.id} />
    </div>
  );
}
