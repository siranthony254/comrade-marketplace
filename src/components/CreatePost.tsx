"use client";

import { useState } from "react";
import { Image as ImageIcon, Link as LinkIcon, X, Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreatePostProps {
  onPostCreated?: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [type, setType] = useState<"STOCK_UPDATE" | "NEED_ITEM" | "GENERAL" | "PROMO">("GENERAL");
  const [images, setImages] = useState<File[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("content", content);
    formData.append("type", type);
    if (linkUrl) formData.append("linkUrl", linkUrl);
    if (linkTitle) formData.append("linkTitle", linkTitle);
    if (linkDescription) formData.append("linkDescription", linkDescription);
    images.forEach((img) => formData.append("images", img));

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create post");
      }

      setContent("");
      setImages([]);
      setLinkUrl("");
      setLinkTitle("");
      setLinkDescription("");
      setType("GENERAL");
      onPostCreated?.();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="text-sm font-medium bg-muted border border-border rounded-lg px-3 py-2 mb-3"
          >
            <option value="GENERAL">General Post</option>
            <option value="STOCK_UPDATE">Stock Update (Sellers)</option>
            <option value="NEED_ITEM">Looking For (Buyers)</option>
            <option value="PROMO">Promotion</option>
          </select>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full min-h-[100px] bg-transparent border-0 resize-none focus:outline-none text-base"
            maxLength={5000}
          />
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square">
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Upload ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Add a link (optional)"
              className="flex-1 bg-transparent border-0 focus:outline-none text-sm"
            />
          </div>
          {linkUrl && (
            <div className="flex gap-2">
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Link title (optional)"
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                placeholder="Link description (optional)"
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm">Photo</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Posting..." : (
              <>
                <Send className="w-4 h-4" />
                Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
