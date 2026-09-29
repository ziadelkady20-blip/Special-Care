import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCaseDetail } from "@/lib/queries";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { calculateAge, formatDate, genderLabel, statusLabels } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlatformCaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.user.role !== "SUPER_ADMIN") return <div className="rounded-2xl border border-border bg-surface p-6">غير مصرح</div>;
  const { id } = await params;
  const detail = await getCaseDetail(null, id);
  if (!detail) notFound();
  const { case: cs, child, parent, globalProfile, diagnoses, services, followUps, reports, center } = detail as any;
  const fullName = [child.firstName, child.middleName, child.lastName].filter(Boolean).join(" ");
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-primary font-semibold">إدارة المنصة</p><h1 className="text-3xl font-bold text-ink mt-1">ملف حالة مركزي</h1><p className="text-muted mt-2">عرض شامل للحالة من منظور مالك المنصة — بدون تعديل مباشر من هذه الشاشة.</p></div><Link href="/admin/cases" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold">كل الحالات</Link></div>
    <Card><CardContent className="p-6"><div className="flex flex-col md:flex-row gap-5 md:items-center"><div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">{child.firstName.slice(0,1)}</div><div className="flex-1"><div className="flex flex-wrap gap-2 items-center"><h2 className="text-2xl font-bold">{fullName}</h2><Badge variant={cs.status === "ACTIVE" ? "success" : cs.status === "ON_HOLD" ? "warning" : "muted"}>{statusLabels[cs.status] ?? cs.status}</Badge></div><p className="text-sm text-muted mt-1">{cs.caseNumber} · {center?.name ?? "—"} · تسجيل {formatDate(cs.registrationDate)}</p></div></div></CardContent></Card>
    <div className="grid lg:grid-cols-3 gap-4"><Card><CardHeader><CardTitle>بيانات الطفل</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><span className="text-muted">العمر:</span> {calculateAge(child.dateOfBirth)} سنة</p><p><span className="text-muted">النوع:</span> {genderLabel(child.gender)}</p><p><span className="text-muted">المدينة:</span> {child.city ?? "—"}</p></CardContent></Card><Card><CardHeader><CardTitle>ولي الأمر</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>{parent?.name ?? "—"}</p><p className="text-muted">{parent?.phone ?? "—"}</p><p className="text-muted">{parent?.email ?? "—"}</p></CardContent></Card><Card><CardHeader><CardTitle>الملف العام</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><span className="text-muted">التشخيص:</span> {globalProfile?.diagnosisName ?? "—"}</p><p><span className="text-muted">الدرجة:</span> {globalProfile?.severity ?? "—"}</p></CardContent></Card></div>
    <div className="grid lg:grid-cols-2 gap-4"><Card><CardHeader><CardTitle>الخدمات ({services.length})</CardTitle></CardHeader><CardContent className="space-y-3">{services.map((s:any)=><div key={s.id} className="rounded-xl border border-border p-3"><p className="font-semibold">{s.serviceName}</p><p className="text-xs text-muted mt-1">{s.specialistName ?? "بدون أخصائي"} · {s.status}</p></div>)}{!services.length&&<p className="text-sm text-muted">لا توجد خدمات.</p>}</CardContent></Card><Card><CardHeader><CardTitle>المتابعات ({followUps.length})</CardTitle></CardHeader><CardContent className="space-y-3">{followUps.slice(0,8).map((f:any)=><div key={f.id} className="rounded-xl border border-border p-3"><div className="flex justify-between gap-3"><span className="font-semibold">{f.progress}</span><span className="text-xs text-muted">{formatDate(f.followUpDate)}</span></div><p className="text-xs text-muted mt-1">{f.specialistName ?? "—"}</p></div>)}{!followUps.length&&<p className="text-sm text-muted">لا توجد متابعات.</p>}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>التشخيصات والتقارير</CardTitle></CardHeader><CardContent><p className="text-sm text-muted">{diagnoses.length} تشخيص · {reports.length} تقرير طبي. هذه الشاشة للمتابعة المركزية فقط.</p></CardContent></Card>
  </div>;
}
