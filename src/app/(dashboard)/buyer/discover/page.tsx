// /buyer/discover

import { ExploreView } from "@/components/ExploreView";

export const dynamic = "force-dynamic";

export default function DiscoverPage({ searchParams }: { searchParams: { q?: string; category?: string; schoolId?: string } }) {
  return <ExploreView action="/buyer/discover" searchParams={searchParams} />;
}
