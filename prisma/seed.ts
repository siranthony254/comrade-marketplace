// prisma/seed.ts — run with: npm run db:seed
// Idempotent: safe to run repeatedly. Creates the school list and (optionally) your admin account.
//
// Admin:  set ADMIN_EMAIL, ADMIN_PHONE and ADMIN_PASSWORD in .env.local before seeding.
// Schools: a starter list — verify it and add your own campus/TVET/college via Prisma Studio (npm run db:studio).

import { PrismaClient, type SchoolType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SCHOOLS: { name: string; shortName: string; type: SchoolType; county: string; town: string }[] = [
  { name: "University of Nairobi", shortName: "UoN", type: "UNIVERSITY", county: "Nairobi", town: "Nairobi" },
  { name: "Kenyatta University", shortName: "KU", type: "UNIVERSITY", county: "Kiambu", town: "Ruiru" },
  { name: "Jomo Kenyatta University of Agriculture and Technology", shortName: "JKUAT", type: "UNIVERSITY", county: "Kiambu", town: "Juja" },
  { name: "Moi University", shortName: "Moi", type: "UNIVERSITY", county: "Uasin Gishu", town: "Eldoret" },
  { name: "Egerton University", shortName: "Egerton", type: "UNIVERSITY", county: "Nakuru", town: "Njoro" },
  { name: "Maseno University", shortName: "Maseno", type: "UNIVERSITY", county: "Kisumu", town: "Maseno" },
  { name: "Technical University of Kenya", shortName: "TUK", type: "UNIVERSITY", county: "Nairobi", town: "Nairobi" },
  { name: "Multimedia University of Kenya", shortName: "MMU", type: "UNIVERSITY", county: "Nairobi", town: "Nairobi" },
  { name: "Dedan Kimathi University of Technology", shortName: "DeKUT", type: "UNIVERSITY", county: "Nyeri", town: "Nyeri" },
  { name: "Kirinyaga University", shortName: "Kirinyaga", type: "UNIVERSITY", county: "Kirinyaga", town: "Kerugoya" },
  { name: "Strathmore University", shortName: "Strath", type: "UNIVERSITY", county: "Nairobi", town: "Nairobi" },
  { name: "United States International University Africa", shortName: "USIU-A", type: "UNIVERSITY", county: "Nairobi", town: "Nairobi" },
  { name: "Mount Kenya University", shortName: "MKU", type: "UNIVERSITY", county: "Kiambu", town: "Thika" },
  { name: "Zetech University", shortName: "Zetech", type: "UNIVERSITY", county: "Kiambu", town: "Ruiru" },
  { name: "Kenya Medical Training College — Nairobi", shortName: "KMTC Nairobi", type: "KMTC", county: "Nairobi", town: "Nairobi" },
  { name: "Kenya Medical Training College — Mombasa", shortName: "KMTC Mombasa", type: "KMTC", county: "Mombasa", town: "Mombasa" },
  { name: "Kenya Medical Training College — Kisumu", shortName: "KMTC Kisumu", type: "KMTC", county: "Kisumu", town: "Kisumu" },
  { name: "Kenya Medical Training College — Eldoret", shortName: "KMTC Eldoret", type: "KMTC", county: "Uasin Gishu", town: "Eldoret" },
];

async function main() {
  for (const s of SCHOOLS) {
    await prisma.school.upsert({ where: { name: s.name }, update: {}, create: s });
  }
  console.log(`✓ ${SCHOOLS.length} schools`);

  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const phone = process.env.ADMIN_PHONE; // 2547XXXXXXXX
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !phone || !password) {
    console.log("• Skipped admin (set ADMIN_EMAIL, ADMIN_PHONE=2547XXXXXXXX and ADMIN_PASSWORD to create one)");
    return;
  }
  if (!/^254[17]\d{8}$/.test(phone)) throw new Error("ADMIN_PHONE must look like 254712345678");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, phone, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN", status: "ACTIVE" },
  });
  console.log(`✓ admin ${email}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
