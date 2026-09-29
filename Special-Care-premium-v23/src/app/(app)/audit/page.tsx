import { requireSession } from "@/lib/session";
import { canViewAudit } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listAuditLogs } from "@/lib/queries";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const actionLabels: Record<string, string> = {
  LOGIN: "تسجيل دخول",
  PASSWORD_CHANGED: "تغيير كلمة المرور",
  PASSWORD_CHANGE_FAILED: "محاولة تغيير كلمة المرور",
  CREATE_CASE: "إنشاء حالة",
  UPDATE_CASE: "تعديل حالة",
  UPDATE_CASE_STATUS: "تغيير حالة المتابعة",
  CREATE_FOLLOWUP: "إضافة متابعة",
  CREATE_NOTE: "إضافة ملاحظة",
  CREATE_USER: "إنشاء مستخدم",
  UPDATE_USER: "تعديل مستخدم",
  TOGGLE_USER_STATUS: "تغيير حالة مستخدم",
  UPLOAD_ATTACHMENT: "رفع مستند",
  REGISTER_ATTACHMENT: "تسجيل مستند",
  DELETE_ATTACHMENT: "حذف مستند",
  CREATE_MEDICAL_REPORT: "إضافة تقرير طبي",
  EXPORT_REPORT_CSV: "تصدير تقرير",
};

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; entityType?: string; from?: string; to?: string; page?: string }> }) {
  const session = await requireSession();
  if (!canViewAudit(session.user.role)) redirect("/dashboard?error=forbidden");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const data = await listAuditLogs(session.user.centerId, {
    action: params.action,
    entityType: params.entityType,
    from: params.from,
    to: params.to,
    page,
  });

  return (
    <>
      <PageHeader title="سجل النشاط" subtitle="سجل تدقيقي للعمليات المهمة داخل المركز." />
      <Card className="p-4 mb-4">
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" method="GET">
          <div>
            <label className="text-xs text-muted">نوع العملية</label>
            <select name="action" defaultValue={params.action ?? ""} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm">
              <option value="">كل العمليات</option>
              {Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted">نوع العنصر</label>
            <select name="entityType" defaultValue={params.entityType ?? ""} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm">
              <option value="">كل العناصر</option>
              <option value="case">حالة</option>
              <option value="follow_up">متابعة</option>
              <option value="user">مستخدم</option>
              <option value="attachment">مستند</option>
              <option value="report">تقرير</option>
              <option value="session">جلسة</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted">من تاريخ</label>
            <input type="date" name="from" defaultValue={params.from ?? ""} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted">إلى تاريخ</label>
            <input type="date" name="to" defaultValue={params.to ?? ""} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm" />
          </div>
          <div className="flex items-end"><button className="h-9 rounded-lg bg-primary text-white px-4 text-sm font-medium w-full">تطبيق</button></div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {data.rows.length === 0 ? <EmptyState title="لا توجد سجلات مطابقة" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background text-xs text-muted"><tr>
                <th className="px-4 py-3 text-start">التاريخ</th>
                <th className="px-4 py-3 text-start">المستخدم</th>
                <th className="px-4 py-3 text-start">العملية</th>
                <th className="px-4 py-3 text-start">العنصر</th>
                <th className="px-4 py-3 text-start">المعرّف</th>
                <th className="px-4 py-3 text-start">IP</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {data.rows.map((row) => <tr key={row.id} className="hover:bg-background/50">
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
                  <td className="px-4 py-3"><div className="font-medium">{row.userName ?? "—"}</div><div className="text-xs text-muted">{row.userEmail ?? "—"}</div></td>
                  <td className="px-4 py-3"><Badge variant="outline">{actionLabels[row.action] ?? row.action}</Badge></td>
                  <td className="px-4 py-3 text-muted">{row.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted max-w-40 truncate">{row.entityId ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{row.ipAddress ?? "—"}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {data.total > data.pageSize ? <div className="flex items-center justify-between mt-4 text-sm text-muted"><span>إجمالي السجلات: {data.total}</span><div className="flex gap-2">{data.page > 1 ? <a className="rounded-lg border border-border px-3 py-1.5" href={`?page=${data.page - 1}`}>السابق</a> : null}{data.page * data.pageSize < data.total ? <a className="rounded-lg border border-border px-3 py-1.5" href={`?page=${data.page + 1}`}>التالي</a> : null}</div></div> : null}
    </>
  );
}
