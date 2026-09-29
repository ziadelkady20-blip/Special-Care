import { requireSession } from "@/lib/session";
import { getDashboardStats, listNotifications } from "@/lib/queries";
import {
  Users2,
  Activity,
  TrendingUp,
  CalendarCheck,
  FileText,
  Bell,
  CheckCircle2,
  Clock,
  ArrowLeft,
  UserPlus,
  BarChart3,
  ClipboardPlus,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  Badge,
  PageHeader,
} from "@/components/ui";
import { DashboardCharts } from "./dashboard-charts";
import { calculateAge, formatDate, genderLabel, statusLabels, statusColor } from "@/lib/utils";
import { canCreateCases } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  if (session.user.role === "SUPER_ADMIN") {
    const { redirect } = await import("next/navigation");
    redirect("/admin/platform");
  }
  const stats = await getDashboardStats(session.user.centerId);
  const notifications = await listNotifications(session.user.id);

  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  const canCreate = canCreateCases(session.user.role);

  const monthlyFormatted = stats.monthly.map((m) => {
    const [y, mo] = m.month.split("-");
    return { month: monthNames[parseInt(mo) - 1] ?? m.month, cases: parseInt(m.total) };
  });

  return (
    <>
      <PageHeader
        title={`مرحبًا، ${session.user.name.split(" ")[0]} 👋`}
        subtitle="إليك نظرة سريعة على الحالات والمتابعات اليوم."
      />

      {/* Quick actions */}
      <div className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">اختصارات سريعة</p>
            <p className="mt-0.5 text-xs text-muted">ابدأ أهم المهام من لوحة التحكم مباشرة.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
{canCreate ? (
              <Link href="/cases/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90">
                <UserPlus className="h-4 w-4" />
                حالة جديدة
              </Link>
            ) : null}
            <Link href="/follow-ups" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-ink transition hover:bg-background">
              <ClipboardPlus className="h-4 w-4 text-primary" />
              المتابعات
            </Link>
            <Link href="/reports" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-ink transition hover:bg-background">
              <BarChart3 className="h-4 w-4 text-primary" />
              التقارير
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="إجمالي الحالات" value={stats.totalCases} icon={Users2} tone="primary" hint="كل الحالات المسجلة" />
        <StatCard title="حالات نشطة" value={stats.activeCases} icon={Activity} tone="success" hint="قيد المتابعة" />
        <StatCard title="حالات جديدة هذا الشهر" value={stats.newThisMonth} icon={TrendingUp} tone="accent" />
        <StatCard title="متابعات قادمة" value={stats.upcomingFollowUps} icon={CalendarCheck} tone="warning" hint="خلال أسبوعين" />
        <StatCard title="أطفال مرتبطون بالمركز" value={stats.joinedChildrenCount} icon={Users2} tone="primary" hint="علاقات نشطة" />
      </div>

      {/* Operational pulse */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-primary/10 bg-primary/[0.045] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">الحالات النشطة</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{stats.activeCases}</p>
          <p className="mt-1 text-[11px] text-muted">حالات تحتاج متابعة مستمرة</p>
        </div>
        <div className="rounded-2xl border border-accent/15 bg-accent/[0.055] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">المتابعات القادمة</span>
            <CalendarCheck className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{stats.upcomingFollowUps}</p>
          <p className="mt-1 text-[11px] text-muted">خلال الأسبوعين القادمين</p>
        </div>
        <div className="rounded-2xl border border-primary-light/20 bg-primary-light/[0.055] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">حالات جديدة</span>
            <TrendingUp className="h-4 w-4 text-primary-light" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{stats.newThisMonth}</p>
          <p className="mt-1 text-[11px] text-muted">تم تسجيلها هذا الشهر</p>
        </div>
      </div>

      {/* Intake attention */}
      {(stats.unassignedCases > 0 || stats.casesWithoutFollowUp > 0) ? (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.unassignedCases > 0 ? <Link href="/intake" className="rounded-2xl border border-warning/20 bg-warning/[0.06] p-4 hover:bg-warning/[0.09] transition-colors"><p className="text-xs text-muted">تحتاج تعيين أخصائي</p><p className="mt-1 text-2xl font-bold text-ink">{stats.unassignedCases}</p><p className="mt-1 text-xs text-muted">حالات نشطة بدون أخصائي مسؤول</p></Link> : null}
          {stats.casesWithoutFollowUp > 0 ? <Link href="/cases" className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 hover:bg-primary/[0.07] transition-colors"><p className="text-xs text-muted">تحتاج أول متابعة</p><p className="mt-1 text-2xl font-bold text-ink">{stats.casesWithoutFollowUp}</p><p className="mt-1 text-xs text-muted">حالات نشطة لم تسجل لها متابعة بعد</p></Link> : null}
        </div>
      ) : null}

      {/* Parent joins / intake */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>آخر الأطفال المنضمين</CardTitle><p className="text-xs text-muted mt-1">الأطفال الذين اختاروا هذا المركز من بوابة ولي الأمر.</p></div>
          <Link href="/intake" className="text-xs text-primary font-medium">عرض كل الانضمامات</Link>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentJoins.length === 0 ? <p className="px-6 py-8 text-sm text-muted text-center">لا يوجد انضمامات جديدة بعد.</p> : <ul className="divide-y divide-border">
            {stats.recentJoins.map((j) => <li key={j.membershipId} className="px-6 py-3.5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">{j.firstName.slice(0, 1)}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-ink">{j.firstName} {j.lastName}</p><p className="text-xs text-muted mt-0.5">ولي الأمر: {j.parentName ?? "غير متاح"}{j.parentPhone ? ` · ${j.parentPhone}` : ""}</p></div>
              <span className="text-[11px] rounded-full bg-success/10 text-success px-2.5 py-1">عضوية نشطة</span>
            </li>)}
          </ul>}
        </CardContent>
      </Card>

      {/* Charts */}
      <DashboardCharts
        monthly={monthlyFormatted}
        byDisability={stats.byDisability.map((d) => ({ name: d.name, value: parseInt(d.total) }))}
        ageDistribution={stats.ageDistribution.map((d) => ({ bucket: d.bucket, total: parseInt(d.total) }))}
      />

      {/* Recent cases + upcoming follow-ups + notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>أحدث الحالات</CardTitle>
            <Link href="/cases" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              عرض الكل <ArrowLeft className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentCases.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted text-center">لا توجد حالات بعد.</p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.recentCases.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/cases/${c.id}`}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-background transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {c.firstName.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-xs text-muted tabular-nums">
                          {c.caseNumber} · {calculateAge(c.dateOfBirth)} سنة · {genderLabel(c.gender)}
                        </p>
                      </div>
                      <Badge variant={c.status === "ACTIVE" ? "success" : c.status === "ON_HOLD" ? "warning" : "muted"}>
                        {statusLabels[c.status] ?? c.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-warning" />
                متابعات قادمة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stats.upcoming.length === 0 ? (
                <p className="px-6 py-6 text-sm text-muted text-center">لا توجد متابعات قادمة.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {stats.upcoming.slice(0, 5).map((f) => (
                    <li key={f.id} className="px-6 py-3">
                      <Link href={`/cases/${f.caseId}`} className="block hover:text-primary">
                        <p className="text-sm font-medium text-ink">
                          {f.firstName} {f.lastName}
                        </p>
                        <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                          <CalendarCheck className="h-3 w-3" />
                          {formatDate(f.followUpDate)}
                          {f.specialistName ? <span> · {f.specialistName}</span> : null}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-primary-light" />
                إشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <p className="px-6 py-6 text-sm text-muted text-center">لا توجد إشعارات.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.slice(0, 4).map((n) => (
                    <li key={n.id} className="px-6 py-3">
                      <div className="flex items-start gap-2">
                        {!n.isRead ? (
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                        ) : (
                          <span className="mt-1.5 h-2 w-2 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink">{n.title}</p>
                          <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
