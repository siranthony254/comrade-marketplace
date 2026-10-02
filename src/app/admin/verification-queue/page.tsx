// /admin/verification-queue — a human compares the ID card, the selfie and what the student typed.

import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/utils";
import { DecisionButtons } from "./DecisionButtons";

export const dynamic = "force-dynamic";

export default async function VerificationQueue() {
  const pending = await prisma.studentProfile.findMany({
    where: { user: { status: "PENDING_REVIEW", role: "STUDENT" } },
    orderBy: { createdAt: "asc" }, // oldest first: fairest, and keeps the 24h promise
    take: 30,
    include: { school: true, user: { select: { email: true, phone: true } } },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">ID verification</h1>
        <p className="text-sm text-muted-foreground">Check that: (1) the ID belongs to the school chosen, (2) the number and name match what they typed, (3) the selfie is the same person, (4) the ID looks genuine and current.</p>
      </div>
      {pending.length === 0 && <div className="stat-card text-center py-12 text-sm text-muted-foreground">All caught up 🎉</div>}
      {pending.map((p) => (
        <div key={p.id} className="stat-card space-y-3">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <div>
              <p className="font-semibold text-base">{p.fullName}</p>
              <p className="text-muted-foreground">{p.school.name}</p>
              <p>ID number: <strong className="font-mono">{p.idNumber}</strong>{p.yearOfStudy ? ` · Year ${p.yearOfStudy}` : ""}{p.courseOfStudy ? ` · ${p.courseOfStudy}` : ""}</p>
              <p className="text-xs text-muted-foreground">{p.user.email} · +{p.user.phone} · signed up {timeAgo(p.createdAt)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["id", "selfie"] as const).map((k) => (
              <a key={k} href={`/api/admin/verification/${p.id}/${k}`} target="_blank" rel="noopener noreferrer">
                <img src={`/api/admin/verification/${p.id}/${k}`} alt={k === "id" ? "Student ID card" : "Selfie with ID"} className="w-full h-56 object-contain bg-muted rounded-lg border border-border" />
                <p className="text-xs text-center text-muted-foreground mt-1">{k === "id" ? "Student ID card" : "Selfie"} (click to enlarge)</p>
              </a>
            ))}
          </div>
          <DecisionButtons profileId={p.id} />
        </div>
      ))}
    </div>
  );
}
