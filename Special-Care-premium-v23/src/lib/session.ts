import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { authOptions, type AppSession, type AppRole, type AppUser } from "@/lib/auth";
import { db } from "@/db";
import { centers, roles, users, parents } from "@/db/schema";

/**
 * Read the session token, then re-hydrate the user from the database.
 * This prevents a disabled user or suspended center from keeping access
 * for the full JWT lifetime.
 */
export async function getCurrentAppUser(): Promise<AppUser | null> {
  const session = (await getServerSession(authOptions)) as AppSession | null;
  const sessionUser = session?.user;
  if (!sessionUser?.id) return null;

  if ((sessionUser as AppUser).accountType === "PARENT") {
    const [parent] = await db
      .select({ id: parents.id, name: parents.name, email: parents.email, phone: parents.phone, status: parents.status })
      .from(parents)
      .where(and(eq(parents.id, sessionUser.id), eq(parents.status, "ACTIVE")))
      .limit(1);
    if (!parent) return null;
    return {
      id: parent.id, accountType: "PARENT", name: parent.name, email: parent.email, phone: parent.phone,
      roleId: "PARENT", role: "PARENT" as AppRole, centerId: "", centerName: "", parentId: parent.id,
    } as AppUser;
  }

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      roleId: users.roleId,
      role: roles.name,
      centerId: users.centerId,
      centerName: centers.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .innerJoin(centers, eq(users.centerId, centers.id))
    .where(
      and(
        eq(users.id, sessionUser.id),
        eq(users.status, "ACTIVE"),
        eq(centers.status, "ACTIVE"),
      ),
    )
    .limit(1);

  return row ? (row as AppUser) : null;
}

export async function requireSession(): Promise<AppSession> {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");
  return { user } as AppSession;
}

export function requireRole(session: AppSession, allowed: AppRole[]) {
  if (!allowed.includes(session.user.role)) {
    redirect("/dashboard?error=forbidden");
  }
}
