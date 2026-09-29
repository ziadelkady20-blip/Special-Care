import { requireSession } from "@/lib/session";
import { canViewReports } from "@/lib/auth";
import { canExport } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getProgressAnalytics, getReportsData, getReferenceData } from "@/lib/queries";
import { Card, StatCard, PageHeader } from "@/components/ui";
import { BarChart3, Users, CalendarCheck, FileText } from "lucide-react";
import { ReportsCharts } from "./reports-charts";
import { ProgressAnalytics } from "./progress-analytics";
import { statusLabels, genderLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const session = await requireSession();
  if (!canViewReports(session.user.role)) redirect("/dashboard?error=forbidden");
  const params = await searchParams;
  const filters: { status?: string; from?: string; to?: string; disabilityId?: string; gender?: "MALE" | "FEMALE"; specialistId?: string; ageMin?: number; ageMax?: number } = {
    status: typeof params.status === "string" ? params.status : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
    disabilityId: typeof params.disabilityId === "string" ? params.disabilityId : undefined,
    gender: params.gender === "MALE" || params.gender === "FEMALE" ? params.gender : undefined,
    specialistId: typeof params.specialistId === "string" ? params.specialistId : undefined,
    ageMin: typeof params.ageMin === "string" && /^\d{1,3}$/.test(params.ageMin) ? Number(params.ageMin) : undefined,
    ageMax: typeof params.ageMax === "string" && /^\d{1,3}$/.test(params.ageMax) ? Number(params.ageMax) : undefined,
  };
  const [data, reference, progressAnalytics] = await Promise.all([
    getReportsData(session.user.centerId, filters),
    getReferenceData(session.user.centerId),
    getProgressAnalytics(session.user.centerId),
  ]);
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") exportParams.set(key, String(value));
  return (<><PageHeader title="التقارير والإحصائيات" subtitle="نظرة تحليلية على أداء المركز والحالات." actions={<div className="flex items-center gap-2"><div className="flex items-center gap-2 text-xs text-muted"><FileText className="h-4 w-4" />يراعى صلاحياتك عند التصدير</div>{canExport(session.user.role) ? <a href={`/api/reports/export?${exportParams.toString()}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-ink hover:bg-background">تصدير CSV</a> : null}</div>} />
  <Card className="p-4 mb-4"><form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
  <div><label className="text-xs text-muted">الحالة</label><select name="status" defaultValue={filters.status ?? ""} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"><option value="">الكل</option><option value="ACTIVE">نشط</option><option value="ON_HOLD">معلّق</option><option value="CLOSED">مغلق</option></select></div>
  <div><label className="text-xs text-muted">نوع الإعاقة</label><select name="disabilityId" defaultValue={filters.disabilityId ?? ""} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"><option value="">الكل</option>{reference.disabilities.map((d)=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
  <div><label className="text-xs text-muted">النوع</label><select name="gender" defaultValue={filters.gender ?? ""} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"><option value="">الكل</option><option value="MALE">ذكر</option><option value="FEMALE">أنثى</option></select></div>
  <div><label className="text-xs text-muted">الأخصائي</label><select name="specialistId" defaultValue={filters.specialistId ?? ""} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"><option value="">الكل</option>{reference.specialists.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
  <div><label className="text-xs text-muted">العمر من</label><input type="number" min="0" max="120" name="ageMin" defaultValue={filters.ageMin != null ? String(filters.ageMin) : ""} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm" /></div>
  <div><label className="text-xs text-muted">العمر إلى</label><input type="number" min="0" max="120" name="ageMax" defaultValue={filters.ageMax != null ? String(filters.ageMax) : ""} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm" /></div>
  <div><label className="text-xs text-muted">من تاريخ</label><input type="date" name="from" defaultValue={filters.from} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm" /></div>
  <div><label className="text-xs text-muted">إلى تاريخ</label><input type="date" name="to" defaultValue={filters.to} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm" /></div>
  <div className="flex items-end"><button type="submit" className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 w-full">تطبيق</button></div>
  </form></Card>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"><StatCard title="إجمالي الحالات" value={data.totalCases} icon={Users} tone="primary" /><StatCard title="حالات لها متابعات" value={data.withFollowUps} icon={CalendarCheck} tone="success" /><StatCard title="متوسط المتابعات/حالة" value={data.avgFollowUps.toFixed(1)} icon={BarChart3} tone="accent" /></div>
  <ProgressAnalytics data={progressAnalytics} />
  <ReportsCharts byStatus={data.byStatus.map((s)=>({name:statusLabels[s.status]??s.status,value:s.total}))} byGender={data.byGender.map((g)=>({name:genderLabel(g.gender),value:g.total}))} bySpecialist={data.bySpecialist.map((s)=>({name:s.name??"غير معيّن",value:s.total}))} />
  </>);
}
