import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { centers, cases, children, childCenters, parents, followUps } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const progressLabels: Record<string, string> = {
  IMPROVING: "يتحسن",
  STABLE: "مستقر",
  DECLINING: "يتراجع",
  NEEDS_REVIEW: "يحتاج مراجعة",
};

export default async function PlatformOverviewPage() {
  const session = await requireSession();
  if (session.user.role !== "SUPER_ADMIN") return <div className="rounded-2xl border border-border bg-surface p-6">غير مصرح</div>;

  const [counts, centerRows, recentCases, progressRows, overdueRows, centerActivityRows] = await Promise.all([
    Promise.all([
      db.select({ v: sql<number>`count(*)::int` }).from(centers),
      db.select({ v: sql<number>`count(*)::int` }).from(parents),
      db.select({ v: sql<number>`count(*)::int` }).from(children),
      db.select({ v: sql<number>`count(*)::int` }).from(cases),
      db.select({ v: sql<number>`count(*)::int` }).from(childCenters).where(eq(childCenters.status, "ACTIVE")),
      db.select({ v: sql<number>`count(*)::int` }).from(cases).where(eq(cases.status, "ACTIVE")),
    ]),
    db.select({
      id: centers.id,
      name: centers.name,
      status: centers.status,
      createdAt: centers.createdAt,
      childCount: sql<number>`count(distinct ${childCenters.childId})::int`,
      caseCount: sql<number>`count(distinct ${cases.id})::int`,
      followUpCount: sql<number>`count(distinct ${followUps.id})::int`,
    }).from(centers)
      .leftJoin(childCenters, eq(childCenters.centerId, centers.id))
      .leftJoin(cases, eq(cases.centerId, centers.id))
      .leftJoin(followUps, eq(followUps.caseId, cases.id))
      .groupBy(centers.id)
      .orderBy(desc(centers.createdAt)),
    db.select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      centerName: centers.name,
      firstName: children.firstName,
      lastName: children.lastName,
      status: cases.status,
      updatedAt: cases.updatedAt,
    }).from(cases)
      .innerJoin(centers, eq(cases.centerId, centers.id))
      .innerJoin(children, eq(cases.childId, children.id))
      .orderBy(desc(cases.updatedAt)).limit(12),
    db.execute<{ progress: string; total: string }>(sql`
      SELECT f.progress::text AS progress, COUNT(*)::text AS total
      FROM follow_ups f
      INNER JOIN cases c ON c.id = f.case_id
      GROUP BY f.progress
      ORDER BY COUNT(*) DESC
    `),
    db.execute<{ total: string }>(sql`
      SELECT COUNT(*)::text AS total
      FROM cases c
      WHERE c.status = 'ACTIVE'
        AND EXISTS (SELECT 1 FROM follow_ups f WHERE f.case_id = c.id)
        AND NOT EXISTS (
          SELECT 1 FROM follow_ups f2
          WHERE f2.case_id = c.id
            AND f2.next_follow_up_date IS NOT NULL
            AND f2.next_follow_up_date::date >= CURRENT_DATE
        )
    `),
    db.execute<{ center_name: string; followups: string; cases: string }>(sql`
      SELECT ce.name AS center_name,
             COUNT(DISTINCT f.id)::text AS followups,
             COUNT(DISTINCT c.id)::text AS cases
      FROM centers ce
      LEFT JOIN cases c ON c.center_id = ce.id
      LEFT JOIN follow_ups f ON f.case_id = c.id
      GROUP BY ce.id, ce.name
      ORDER BY COUNT(DISTINCT f.id) DESC, COUNT(DISTINCT c.id) DESC
      LIMIT 8
    `),
  ]);

  const [centerCount, parentCount, childCount, caseCount, activeMemberships, activeCases] = counts.map((x) => x[0]?.v ?? 0);
  const progress = progressRows.rows ?? [];
  const overdue = Number(overdueRows.rows?.[0]?.total ?? 0);
  const centerActivity = centerActivityRows.rows ?? [];
  const progressTotal = progress.reduce((sum, row) => sum + Number(row.total), 0);

  return <div className="space-y-7">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div><p className="text-sm text-primary font-semibold">إدارة المنصة</p><h1 className="text-3xl font-bold text-ink mt-1">نظرة عامة على Special Care</h1><p className="text-muted mt-2">الصورة الكاملة للحالات والمراكز وتطورات الملفات على مستوى المنصة.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/cases" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink">كل الحالات</Link><Link href="/admin/centers" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">إدارة المراكز</Link></div>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {[
        ["المراكز", centerCount], ["أولياء الأمور", parentCount], ["الأطفال", childCount], ["الحالات", caseCount], ["الحالات النشطة", activeCases], ["عضويات المراكز", activeMemberships],
      ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs text-muted">{label}</p><p className="text-2xl font-bold text-ink mt-2">{value}</p></div>)}
    </div>

    <section className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-lg">مؤشر تطور الحالات</h2><p className="text-xs text-muted mt-1">توزيع نتائج المتابعات المسجلة عبر كل المراكز.</p></div><span className="text-xs text-muted">{progressTotal} متابعة</span></div>
        <div className="mt-5 space-y-4">
          {progress.map((row) => {
            const value = Number(row.total);
            const width = progressTotal ? Math.max(4, Math.round((value / progressTotal) * 100)) : 0;
            return <div key={row.progress}>
              <div className="flex justify-between text-sm mb-1.5"><span className="font-medium">{progressLabels[row.progress] ?? row.progress}</span><span className="text-muted">{value}</span></div>
              <div className="h-2.5 rounded-full bg-background overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} /></div>
            </div>;
          })}
          {!progress.length ? <p className="text-sm text-muted py-6 text-center">لا توجد متابعات حتى الآن.</p> : null}
        </div>
      </div>
      <div className={`rounded-2xl border p-5 ${overdue > 0 ? "border-warning/30 bg-warning/[0.05]" : "border-border bg-surface"}`}>
        <p className="text-xs text-muted">على مستوى المنصة</p><h2 className="font-bold text-lg mt-1">حالات تحتاج متابعة</h2>
        <p className="text-sm text-muted mt-3">حالات نشطة لديها متابعة سابقة ولا يوجد لها موعد متابعة قادم.</p>
        <p className="text-5xl font-bold text-ink mt-6 tabular-nums">{overdue}</p>
        <p className="text-xs text-muted mt-2">يمكن استخدام هذا المؤشر لمراجعة الحالات التي تحتاج إجراء من المركز.</p>
      </div>
    </section>

    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="p-5 border-b border-border"><h2 className="font-bold text-lg">نشاط المراكز</h2><p className="text-xs text-muted mt-1">عدد الحالات والمتابعات المسجلة لكل مركز.</p></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-muted"><th className="text-start p-4">المركز</th><th className="text-start p-4">الأطفال</th><th className="text-start p-4">الحالات</th><th className="text-start p-4">المتابعات</th><th className="text-start p-4">الحالة</th></tr></thead><tbody>{centerRows.map((c) => <tr key={c.id} className="border-b border-border last:border-0"><td className="p-4 font-semibold">{c.name}</td><td className="p-4">{c.childCount}</td><td className="p-4">{c.caseCount}</td><td className="p-4">{c.followUpCount}</td><td className="p-4"><span className={c.status === "ACTIVE" ? "text-success" : "text-danger"}>{c.status === "ACTIVE" ? "نشط" : "موقوف"}</span></td></tr>)}</tbody></table></div>
    </section>

    <section className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-border bg-surface overflow-hidden"><div className="p-5 border-b border-border"><h2 className="font-bold text-lg">المراكز الأكثر نشاطًا</h2><p className="text-xs text-muted mt-1">ترتيب تشغيلي حسب عدد المتابعات المسجلة.</p></div><div className="divide-y divide-border">{centerActivity.map((row, i) => <div key={row.center_name} className="p-4 flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</div><div className="flex-1"><p className="text-sm font-semibold">{row.center_name}</p><p className="text-xs text-muted mt-1">{row.cases} حالة</p></div><span className="text-sm font-bold">{row.followups} متابعة</span></div>)}</div></div>
      <div className="rounded-2xl border border-border bg-surface overflow-hidden"><div className="p-5 border-b border-border"><h2 className="font-bold text-lg">آخر تطورات الحالات</h2><p className="text-xs text-muted mt-1">آخر الملفات التي تم تحديثها عبر المراكز.</p></div><div className="divide-y divide-border">{recentCases.map((c) => <Link href={`/admin/cases/${c.id}`} key={c.id} className="flex items-center gap-4 p-4 hover:bg-background"><div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">{c.firstName.slice(0,1)}</div><div className="flex-1"><p className="text-sm font-semibold">{c.firstName} {c.lastName}</p><p className="text-xs text-muted mt-1">{c.caseNumber} · {c.centerName}</p></div><span className="text-xs text-muted">{c.status}</span></Link>)}</div></div>
    </section>
  </div>;
}
