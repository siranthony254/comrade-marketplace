// src/app/page.tsx — Homepage with social feed for logged-in users
import Link from "next/link";
import { ArrowRight, Shield, TrendingUp, Users, Store, Share2, Star, PackageCheck, BadgeCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import CreatePost from "@/components/CreatePost";
import PostFeed from "@/components/PostFeed";
import { prisma } from "@/lib/prisma";

// Landing page component for non-logged-in users
function LandingPage() {
  return (
    <main className="min-h-screen bg-background page-animate">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold text-primary">Comrade<span className="text-secondary">Market</span></Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">Join free</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden py-16 sm:py-24 px-4">
        <div className="absolute inset-0 comrade-gradient opacity-5 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-slow" /> Kenya&apos;s student business ecosystem
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6">
            Your hustle, <span className="text-primary">your market,</span><br />your community.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop letting your HELB and parental support leave campus. Buy from fellow students, sell to fellow students, and keep the money circulating among comrades.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <Link href="/register" className="group flex items-center justify-between bg-primary text-white p-5 rounded-xl hover:bg-primary/90 hover:shadow-lg transition-all">
              <div><div className="font-display font-bold text-lg">I&apos;m a student</div><div className="text-sm text-white/80">Buy or sell on campus — free forever</div></div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/explore" className="group flex items-center justify-between bg-card border border-border p-5 rounded-xl hover:border-primary hover:shadow-md transition-all">
              <div><div className="font-display font-bold text-lg">Browse businesses</div><div className="text-sm text-muted-foreground">See what&apos;s available near you</div></div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            {[
              { t: "I'm a supplier", d: "Reach student businesses" },
              { t: "Hire a student", d: "Design, writing, photography & more" },
            ].map((c) => (
              <div key={c.t} className="flex items-center justify-between bg-muted/40 border border-dashed border-border p-5 rounded-xl">
                <div><div className="font-display font-bold text-lg text-muted-foreground">{c.t}</div><div className="text-sm text-muted-foreground">{c.d}</div></div>
                <span className="text-[11px] font-semibold uppercase tracking-wide bg-secondary/20 text-secondary-foreground px-2 py-1 rounded">Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-12">The closed-loop student economy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Verified students only", desc: "Every member is checked against a real student ID, so you're trading with comrades, not strangers." },
              { icon: TrendingUp, title: "Build your business", desc: "Get a free storefront with its own link. Share it on your WhatsApp status and start taking orders." },
              { icon: Shield, title: "Trade safely", desc: "Services and bigger orders are held in escrow until you confirm delivery. No more getting scammed." },
            ].map((i) => (
              <div key={i.title} className="stat-card text-center">
                <div className="w-12 h-12 bg-accent text-primary rounded-xl flex items-center justify-center mx-auto mb-4"><i.icon className="w-6 h-6" /></div>
                <h3 className="font-display font-bold text-lg mb-2">{i.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{i.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-10">What you get today</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Store, label: "Free storefront" },
              { icon: Share2, label: "Shareable link" },
              { icon: Shield, label: "Escrow payments" },
              { icon: PackageCheck, label: "Order tracking" },
              { icon: Star, label: "Reviews" },
              { icon: BadgeCheck, label: "Verified students" },
              { icon: TrendingUp, label: "M-Pesa payouts" },
              { icon: Users, label: "Campus community" },
            ].map((f) => (
              <div key={f.label} className="stat-card flex items-center gap-3 p-4"><f.icon className="w-5 h-5 text-primary shrink-0" /><span className="text-sm font-medium">{f.label}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 comrade-gradient">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-white text-center">
          {[{ v: "Free", l: "To join & sell" }, { v: "Verified", l: "Students only" }, { v: "Safe", l: "Escrow protection" }].map((s) => (
            <div key={s.l}><div className="font-display text-2xl sm:text-4xl font-bold">{s.v}</div><div className="text-xs sm:text-sm text-white/80 mt-1">{s.l}</div></div>
          ))}
        </div>
      </section>

      <footer className="py-10 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-display font-bold text-lg">Comrade<span className="text-secondary">Market</span></Link>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} Comrade Market. Made in Kenya 🇰🇪</div>
        </div>
      </footer>
    </main>
  );
}

// Feed page component for logged-in users
async function FeedPage({ user }: { user: any }) {
  // Fetch initial posts
  const posts = await prisma.post.findMany({
    where: {},
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
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Convert Date to string for client component
  const serializedPosts = posts.map(post => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold text-primary">Comrade<span className="text-secondary">Market</span></Link>
          <div className="flex items-center gap-3">
            <Link href={user.role === "ADMIN" ? "/admin" : "/post-login"} className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">My dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Campus Feed</h1>
        <CreatePost />
        <PostFeed posts={serializedPosts} currentUserId={user.id} />
      </div>
    </div>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <LandingPage />;
  }

  return <FeedPage user={user} />;
}
