// src/lib/auth.ts
// NextAuth config: email-or-phone + password, JWT sessions.
// The JWT carries only id + role. Account STATUS is always read fresh from the
// database (see session.ts) so an admin approving/suspending a user takes effect at once.

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { PLATFORM } from "@/lib/constants/platform";
import { normalizeKenyanPhone } from "@/lib/validations";

// Compared against when the account doesn't exist so "no such user" and
// "wrong password" cost the same time (no account enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync("comrade-market-dummy-password", 12);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email or phone",
      credentials: { identifier: {}, password: {} },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim() ?? "";
        const password = credentials?.password ?? "";
        if (!identifier || !password) return null;

        const phone = identifier.includes("@") ? null : normalizeKenyanPhone(identifier);
        const user = await prisma.user.findFirst({
          where: identifier.includes("@")
            ? { email: identifier.toLowerCase() }
            : phone ? { phone } : { id: "__none__" },
        });

        if (user?.lockedUntil && user.lockedUntil > new Date()) {
          const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
          throw new Error(`Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`);
        }

        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid) {
          if (user) {
            const failures = user.failedLoginCount + 1;
            const lock = failures >= PLATFORM.login.maxFailures;
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginCount: lock ? 0 : failures,
                lockedUntil: lock ? new Date(Date.now() + PLATFORM.login.lockMinutes * 60000) : null,
              },
            });
          }
          return null;
        }

        if (user.status === "SUSPENDED" || user.status === "REJECTED") {
          throw new Error("This account has been closed. Contact support if you think this is a mistake.");
        }

        if (user.failedLoginCount > 0 || user.lockedUntil) {
          await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
        }
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: "STUDENT" | "ADMIN" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "STUDENT" | "ADMIN";
      }
      return session;
    },
  },
};
