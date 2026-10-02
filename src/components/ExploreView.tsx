// Business discovery: filter form + grid. Server component, used by /explore (public) and /buyer/discover (dashboard).

import Link from "next/link";
import { MapPin, Star, Store } from "lucide-react";
import { BUSINESS_CATEGORIES } from "@/lib/constants/platform";
import { listBusinesses, listSchools, type BusinessFilters } from "@/lib/queries";
import { inputCls } from "@/lib/ui";

export async function ExploreView({ action, searchParams }: { action: string; searchParams: BusinessFilters }) {
  const [businesses, schools] = await Promise.all([listBusinesses(searchParams), listSchools()]);
  const filtered = Boolean(searchParams.q || searchParams.category || searchParams.schoolId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Discover student businesses</h1>
        <p className="text-sm text-muted-foreground">Buy from comrades. Every seller is a verified student.</p>
      </div>

      <form action={action} method="get" className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input name="q" defaultValue={searchParams.q} placeholder="Search food, hair, printing…" className={`${inputCls} sm:col-span-2`} />
        <select name="category" defaultValue={searchParams.category ?? ""} className={inputCls}>
          <option value="">All categories</option>
          {BUSINESS_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="schoolId" defaultValue={searchParams.schoolId ?? ""} className={inputCls}>
          <option value="">All campuses</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.shortName}</option>)}
        </select>
        <button className="sm:col-span-4 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold sm:w-32 sm:justify-self-start">Search</button>
      </form>

      {businesses.length === 0 ? (
        <div className="stat-card text-center py-14">
          <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">{filtered ? "No businesses match that search" : "No businesses yet — be the first!"}</p>
          <p className="text-sm text-muted-foreground mt-1">{filtered ? "Try a different word or clear the filters." : "Join, verify your student ID and open your free storefront."}</p>
          {filtered && <Link href={action} className="inline-block mt-4 text-sm text-primary hover:underline">Clear filters</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((b) => (
            <Link key={b.id} href={`/${b.slug}`} className="stat-card block hover:border-primary/50">
              <div className="flex items-start gap-3">
                {b.logoUrl ? (
                  <img src={b.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl comrade-gradient text-white font-display font-bold flex items-center justify-center shrink-0">{b.name[0]?.toUpperCase()}</div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{b.name}</h3>
                  <p className="text-xs text-muted-foreground">{b.category}</p>
                </div>
              </div>
              {b.tagline && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{b.tagline}</p>}
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{b.school.shortName}</span>
                <span className="flex items-center gap-1">
                  {b.rating.count > 0 ? (<><Star className="w-3.5 h-3.5 fill-secondary text-secondary" />{b.rating.avg.toFixed(1)} ({b.rating.count})</>) : "New"}
                  <span className="mx-1">·</span>{b._count.products} item{b._count.products === 1 ? "" : "s"}
                </span>
              </div>
              {!b.isOpen && <p className="text-xs mt-2 text-amber-700">Not taking orders right now</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
