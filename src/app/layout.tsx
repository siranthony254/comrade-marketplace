import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  // Makes relative Open Graph image URLs absolute, so WhatsApp link previews work.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Comrade Market — The Student Business Ecosystem",
    template: "%s | Comrade Market",
  },
  description: "Kenya's student-powered marketplace. Buy, sell, and grow your business within your campus community. Free to join.",
  openGraph: { siteName: "Comrade Market", locale: "en_KE", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#00A550" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-body antialiased">{children}</body>
    </html>
  );
}
