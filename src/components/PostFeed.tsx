"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Post {
  id: string;
  type: string;
  content: string;
  images: string[];
  linkUrl: string | null;
  linkTitle: string | null;
  linkDescription: string | null;
  linkImage: string | null;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    school: { name: string; shortName: string };
    business: { name: string; slug: string; logoUrl: string | null } | null;
  };
  business: {
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  _count: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface PostFeedProps {
  posts: Post[];
  currentUserId?: string;
  onPostDeleted?: (postId: string) => void;
}

export default function PostFeed({ posts, currentUserId, onPostDeleted }: PostFeedProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch liked posts if currentUserId is provided
    if (currentUserId) {
      fetchLikedPosts();
    }
  }, [currentUserId]);

  const fetchLikedPosts = async () => {
    try {
      const res = await fetch("/api/posts?limit=100");
      const data = await res.json();
      // This would need a separate endpoint to get user's liked posts
      // For now, we'll track likes locally
    } catch (error) {
      console.error("Failed to fetch liked posts", error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.liked) {
        setLikedPosts(new Set([...likedPosts, postId]));
      } else {
        setLikedPosts(new Set([...likedPosts].filter((id) => id !== postId)));
      }
    } catch (error) {
      console.error("Failed to like post", error);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/share`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.shareUrl) {
        // Copy to clipboard
        await navigator.clipboard.writeText(data.shareUrl);
        alert("Share link copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to share post", error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onPostDeleted?.(postId);
      }
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  const toggleComments = async (postId: string) => {
    if (showComments.has(postId)) {
      setShowComments(new Set([...showComments].filter((id) => id !== postId)));
    } else {
      setShowComments(new Set([...showComments, postId]));
      await fetchComments(postId);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments({ ...comments, [postId]: data.comments || [] });
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComments[postId];
    if (!content?.trim()) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setNewComments({ ...newComments, [postId]: "" });
        await fetchComments(postId);
      }
    } catch (error) {
      console.error("Failed to add comment", error);
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case "STOCK_UPDATE":
        return "Stock Update";
      case "NEED_ITEM":
        return "Looking For";
      case "PROMO":
        return "Promotion";
      default:
        return null;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "STOCK_UPDATE":
        return "bg-green-500/10 text-green-600";
      case "NEED_ITEM":
        return "bg-blue-500/10 text-blue-600";
      case "PROMO":
        return "bg-purple-500/10 text-purple-600";
      default:
        return null;
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-card border border-border rounded-xl p-4">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                {post.author.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{post.author.fullName}</span>
                  {getPostTypeLabel(post.type) && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPostTypeColor(post.type)}`}>
                      {getPostTypeLabel(post.type)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {post.author.school.shortName} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            {currentUserId === post.author.id && (
              <button
                onClick={() => handleDelete(post.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Post Content */}
          <p className="mb-4 whitespace-pre-wrap">{post.content}</p>

          {/* Images */}
          {post.images.length > 0 && (
            <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
              {post.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Post image ${i + 1}`}
                  className="w-full h-auto rounded-lg max-h-96 object-cover"
                />
              ))}
            </div>
          )}

          {/* Link Preview */}
          {post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-muted border border-border rounded-lg p-4 mb-4 hover:bg-muted/80 transition-colors"
            >
              {post.linkImage && (
                <img src={post.linkImage} alt="Link preview" className="w-full h-48 object-cover rounded-md mb-3" />
              )}
              <div className="text-sm font-semibold text-primary">{post.linkTitle || post.linkUrl}</div>
              {post.linkDescription && (
                <div className="text-sm text-muted-foreground mt-1">{post.linkDescription}</div>
              )}
            </a>
          )}

          {/* Post Actions */}
          <div className="flex items-center gap-6 pt-4 border-t border-border">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center gap-2 text-sm ${likedPosts.has(post.id) ? "text-red-500" : "text-muted-foreground"} hover:text-red-500 transition-colors`}
            >
              <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
              <span>{post._count.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
            </button>

            <button
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post._count.comments}</span>
            </button>

            <button
              onClick={() => handleShare(post.id)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span>{post._count.shares}</span>
            </button>
          </div>

          {/* Comments Section */}
          {showComments.has(post.id) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="space-y-3 mb-3">
                {comments[post.id]?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                      {comment.author.fullName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.author.fullName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComments[post.id] || ""}
                  onChange={(e) => setNewComments({ ...newComments, [post.id]: e.target.value })}
                  placeholder="Write a comment..."
                  className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm"
                  onKeyPress={(e) => e.key === "Enter" && handleAddComment(post.id)}
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
