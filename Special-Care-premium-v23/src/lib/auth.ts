import "server-only";
import { compare, hash } from "bcryptjs";
import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, roles, centers, auditLogs, parents } from "@/db/schema";
import { assertServerEnv } from "@/lib/env";
import type { AppRole } from "@/lib/permissions";
export type { AppRole } from "@/lib/permissions";
export { canManageUsers, canCreateUsers, canEditUsers, canEditCases, canCreateCases, canChangeCaseStatus, canViewAudit, canAddFollowUps, canExport, canViewReports, canManageCenters } from "@/lib/permissions";

export interface AppUser {
  id: string;
  accountType: "CENTER" | "PARENT";
  name: string;
  email: string;
  phone: string | null;
  roleId: string;
  role: AppRole;
  centerId: string;
  centerName: string;
  parentId?: string;
}

export interface AppSession extends Session {
  user: AppUser;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        assertServerEnv();
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const parentRows = await db
          .select({
            id: parents.id, name: parents.name, email: parents.email, phone: parents.phone,
            passwordHash: parents.passwordHash, status: parents.status,
          })
          .from(parents)
          .where(eq(parents.email, email))
          .limit(1);

        if (parentRows.length === 1) {
          const parent = parentRows[0];
          if (parent.status !== "ACTIVE") return null;
          const ok = await compare(credentials.password, parent.passwordHash);
          if (!ok) return null;
          await db.update(parents).set({ lastLoginAt: new Date() }).where(eq(parents.id, parent.id));
          return {
            id: parent.id, accountType: "PARENT", name: parent.name, email: parent.email, phone: parent.phone,
            roleId: "PARENT", role: "PARENT" as AppRole, centerId: "", centerName: "", parentId: parent.id,
          } as AppUser;
        }

        const rows = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            passwordHash: users.passwordHash,
            status: users.status,
            roleId: users.roleId,
            centerId: users.centerId,
            roleName: roles.name,
            centerName: centers.name,
            centerStatus: centers.status,
          })
          .from(users)
          .innerJoin(roles, eq(users.roleId, roles.id))
          .innerJoin(centers, eq(users.centerId, centers.id))
          .where(eq(users.email, email))
          .limit(2);

        if (rows.length !== 1) return null;
        const row = rows[0];
        if (row.status !== "ACTIVE") return null;
        if (row.centerStatus !== "ACTIVE") return null;

        const ok = await compare(credentials.password, row.passwordHash);
        if (!ok) return null;

        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, row.id));

        await db.insert(auditLogs).values({
          centerId: row.centerId,
          userId: row.id,
          action: "LOGIN",
          entityType: "session",
          entityId: row.id,
        });

        return {
          id: row.id,
          accountType: "CENTER",
          name: row.name,
          email: row.email,
          phone: row.phone,
          roleId: row.roleId,
          role: row.roleName,
          centerId: row.centerId,
          centerName: row.centerName,
        } as AppUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).u = user as AppUser;
      }
      return token;
    },
    async session({ session, token }): Promise<AppSession> {
      return {
        ...session,
        user: (token as any).u ?? session.user,
      } as AppSession;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function hashPassword(pw: string) {
  return hash(pw, 12);
}
