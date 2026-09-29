import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { cases, centers, children, followUps } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PlatformCasesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const session = await requireSession();
  if (session.user.role !== "SUPER_ADMIN") return <div className="rounded-2xl border border-border bg-surface p-6">غير مصرح</div>;
  const params = await searchParams;
  const q = params.q?.trim();
  const status = params.status && ["ACTIVE", "ON_HOLD", "CLOSED", "ARCHIVED"].includes(params.status) ? params.status : undefined;
  const filters = [];
  if (q) filters.push(or(ilike(children.firstName, `%${q}%`), ilike(children.middleName, `%${q}%`), ilike(children.lastName, `%${q}%`), ilike(cases.caseNumber, `%${q}%`), ilike(centers.name, `%${q}%`)));
  if (status) filters.push(eq(cases.status, status as any));
  const rows = await db.select({
    id: cases.id,
    caseNumber: cases.caseNumber,
    childId: children.id,
    firstName: children.firstName,
    middleName: children.middleName,
    lastName: children.lastName,
    centerName: centers.name,
    centerId: centers.id,
    status: cases.status,
    priority: cases.priority,
    registrationDate: cases.registrationDate,
    updatedAt: cases.updatedAt,
    followUps: sql<number>`count(distinct ${followUps.id})::int`,
  }).from(cases)
    .innerJoin(children, eq(cases.childId, children.id))
    .innerJoin(centers, eq(cases.centerId, centers.id))
    .leftJoin(followUps, eq(followUps.caseId, cases.id))
    .where(filters.length ? and(...filters) : undefined)
    .groupBy(cases.id, children.id, centers.id)
    .orderBy(desc(cases.updatedAt));

  return <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div><p className="text-sm text-primary font-semibold">إدارة المنصة</p><h1 className="text-3xl font-bold text-ink mt-1">كل الحالات</h1><p className="text-muted mt-2">عرض مركزي للحالات المسجلة عبر جميع المراكز.</p></div>
      <Link href="/admin/platform" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold">العودة للمنصة</Link>
    </div>
    <form className="grid md:grid-cols-[1fr_180px_auto] gap-3">
      <input name="q" defaultValue={q} placeholder="ابحث بالاسم أو رقم الحالة أو المركز" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
      <select name="status" defaultValue={status ?? ""} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none"><option value="">كل الحالات</option><option value="ACTIVE">نشطة</option><option value="ON_HOLD">معلقة</option><option value="CLOSED">مغلقة</option><option value="ARCHIVED">مؤرشفة</option></select>
      <button className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">بحث</button>
    </form>
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-muted"><th className="p-4 text-start">الحالة</th><th className="p-4 text-start">الطفل</th><th className="p-4 text-start">المركز</th><th className="p-4 text-start">المتابعات</th><th className="p-4 text-start">آخر تحديث</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id} className="border-b border-border last:border-0 hover:bg-background"><td className="p-4"><Link className="font-mono text-xs text-primary hover:underline" href={`/admin/cases/${r.id}`}>{r.caseNumber}</Link><div className="mt-1"><Badge variant={r.status === "ACTIVE" ? "success" : r.status === "ON_HOLD" ? "warning" : "muted"}>{r.status}</Badge></div></td><td className="p-4 font-semibold">{[r.firstName,r.middleName,r.lastName].filter(Boolean).join(" ")}</td><td className="p-4">{r.centerName}</td><td className="p-4">{r.followUps}</td><td className="p-4 text-muted">{new Date(r.updatedAt).toLocaleDateString("ar-EG")}</td></tr>)}</tbody></table></div>
      {!rows.length ? <div className="p-10 text-center text-sm text-muted">لا توجد حالات مطابقة للبحث.</div> : null}
    </div>
  </div>;
}
