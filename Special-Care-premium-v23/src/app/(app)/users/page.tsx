import { requireSession } from "@/lib/session";
import { canManageUsers } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listUsers } from "@/lib/queries";
import { Card, Badge, PageHeader, EmptyState } from "@/components/ui";
import { roleLabels, formatDateTime } from "@/lib/utils";
import { UserPlus, Shield, User, Mail } from "lucide-react";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireSession();
  if (!canManageUsers(session.user.role)) redirect("/dashboard?error=forbidden");

  const users = await listUsers(session.user.centerId);

  return (
    <>
      <PageHeader
        title="المستخدمون"
        subtitle="إدارة أعضاء الفريق وصلاحياتهم في المركز."
        actions={<UsersClient.AddButton />}
      />

      <Card>
        {users.length === 0 ? (
          <EmptyState title="لا يوجد مستخدمون" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start font-semibold">الاسم</th>
                    <th className="px-4 py-3 text-start font-semibold">البريد</th>
                    <th className="px-4 py-3 text-start font-semibold">الدور</th>
                    <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                    <th className="px-4 py-3 text-start font-semibold">آخر دخول</th>
                    <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-background/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {u.name.slice(0, 1)}
                          </div>
                          <span className="font-medium text-ink">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{roleLabels[u.role] ?? u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.status === "ACTIVE" ? "success" : "danger"}>
                          {u.status === "ACTIVE" ? "نشط" : "معطّل"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted tabular-nums text-xs">
                        {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="inline-flex items-center gap-1"><UsersClient.EditButton user={{ id: u.id, name: u.name, phone: u.phone, role: u.role }} /><UsersClient.ToggleButton userId={u.id} currentStatus={u.status} isSelf={u.id === session.user.id} /></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {users.map((u) => (
                <div key={u.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      {u.name.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink">{u.name}</p>
                      <p className="text-xs text-muted truncate">{u.email}</p>
                    </div>
                    <Badge variant={u.status === "ACTIVE" ? "success" : "danger"}>
                      {u.status === "ACTIVE" ? "نشط" : "معطّل"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted">
                      <Shield className="inline h-3 w-3 me-1" />
                      {roleLabels[u.role]}
                    </span>
                    <div className="inline-flex items-center gap-1"><UsersClient.EditButton user={{ id: u.id, name: u.name, phone: u.phone, role: u.role }} /><UsersClient.ToggleButton userId={u.id} currentStatus={u.status} isSelf={u.id === session.user.id} /></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </>
  );
}
