// src/components/layout/DashboardShell.tsx
// Sidebar (desktop) + drawer (mobile) + header with live notifications + sign out.
// Client component; the server layout passes it the signed-in user.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Store, Package, ShoppingBag, Search, Shield, ClipboardList,
  Wallet, Bell, Menu, X, LogOut, ArrowLeftRight, Clock,
} from "lucide-react";
import { api } from "@/lib/client-api";
import { cn, initials, timeAgo } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: React.ElementType };
type Section = "seller" | "buyer" | "admin";

const NAV: Record<Section, NavItem[]> = {
  seller: [
    { label: "Dashboard", href: "/seller", icon: LayoutDashboard },
    { label: "Storefront", href: "/seller/storefront", icon: Store },
    { label: "Products", href: "/seller/products", icon: Package },
    { label: "Orders", href: "/seller/orders", icon: ShoppingBag },
  ],
  buyer: [
    { label: "Discover", href: "/buyer/discover", icon: Search },
    { label: "My Orders", href: "/buyer/orders", icon: ShoppingBag },
  ],
  admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Verifications", href: "/admin/verification-queue", icon: Shield },
    { label: "Disputes", href: "/admin/disputes", icon: ClipboardList },
    { label: "Payouts", href: "/admin/payouts", icon: Wallet },
  ],
};

const SECTION_LABEL: Record<Section, string> = { seller: "🏪 Seller", buyer: "🛒 Buyer", admin: "🛡️ Admin" };

interface ShellUser {
  name: string;
  role: "STUDENT" | "ADMIN";
  status: "PENDING_REVIEW" | "ACTIVE" | "REJECTED" | "SUSPENDED";
}

interface Notif { id: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string }

function NavContent({ section, onNavigate }: { section: Section; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (["/seller", "/admin"].includes(href) ? pathname === href : pathname.startsWith(href));

  return (
    <>
      <div className="px-4 py-3 border-b border-border">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{SECTION_LABEL[section]}</div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV[section].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.href) ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        {section === "seller" && (
          <Link href="/buyer/discover" onClick={onNavigate} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <ArrowLeftRight className="w-4 h-4" /> Switch to buying
          </Link>
        )}
        {section === "buyer" && (
          <Link href="/seller" onClick={onNavigate} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <ArrowLeftRight className="w-4 h-4" /> Switch to selling
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("font-display font-bold text-primary", className)}>
      Comrade<span className="text-secondary">Market</span>
    </Link>
  );
}

export function DashboardShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const section: Section = user.role === "ADMIN" || pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/buyer") ? "buyer" : "seller";

  const [drawer, setDrawer] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  const loadNotifs = useCallback(async () => {
    try {
      const r = await api<{ unread: number; items: Notif[] }>("/api/notifications");
      setUnread(r.unread);
      setNotifs(r.items);
    } catch { /* the bell is non-essential; stay quiet */ }
  }, []);

  useEffect(() => { loadNotifs(); }, [loadNotifs, pathname]);
  useEffect(() => { setDrawer(false); }, [pathname]);

  async function markAllRead() {
    try { await api("/api/notifications", { method: "PATCH" }); await loadNotifs(); } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-card h-screen sticky top-0 overflow-y-auto">
        <div className="h-16 flex items-center px-5 border-b border-border shrink-0"><Logo className="text-lg" /></div>
        <NavContent section={section} />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="relative w-72 max-w-[85%] bg-card h-full flex flex-col overflow-y-auto shadow-xl">
            <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0">
              <Logo className="text-lg" />
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="p-2 -mr-2"><X className="w-5 h-5" /></button>
            </div>
            <NavContent section={section} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawer(true)} aria-label="Open menu" className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <Logo className="md:hidden" />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => { setNotifsOpen((o) => !o); if (!notifsOpen) loadNotifs(); }}
                aria-label="Notifications"
                className="relative p-2 rounded-lg hover:bg-muted"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {notifsOpen && (
                <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-semibold text-sm">Notifications</span>
                    <button onClick={() => setNotifsOpen(false)} aria-label="Close"><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <div className="divide-y divide-border max-h-80 overflow-y-auto">
                    {notifs.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nothing yet.</p>}
                    {notifs.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link ?? "#"}
                        onClick={() => setNotifsOpen(false)}
                        className={cn("block px-4 py-3 hover:bg-muted", !n.readAt && "bg-accent/30")}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                      </Link>
                    ))}
                  </div>
                  {unread > 0 && (
                    <div className="px-4 py-2 border-t border-border">
                      <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all as read</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs" title={user.name}>
              {initials(user.name)}
            </div>
          </div>
        </header>

        {user.status === "PENDING_REVIEW" && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 md:px-6 py-3 flex items-start gap-3 text-sm text-amber-900">
            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              <strong>We&apos;re checking your student ID</strong> (usually under 24 hours). You can look around now — buying, selling and listing
              switch on as soon as it&apos;s approved.
            </p>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 page-animate overflow-auto">{children}</main>
      </div>
    </div>
  );
}
