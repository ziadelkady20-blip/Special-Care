"use client";

import {
  Users2,
  CalendarCheck,
  TrendingUp,
  FileText,
  Activity,
  ChevronLeft,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const monthlyData = [
  { m: "يناير", cases: 12 },
  { m: "فبراير", cases: 15 },
  { m: "مارس", cases: 18 },
  { m: "أبريل", cases: 22 },
  { m: "مايو", cases: 27 },
  { m: "يونيو", cases: 31 },
  { m: "يوليو", cases: 38 },
];

const disabilityData = [
  { name: "توحد", value: 42, color: "#16423C" },
  { name: "إعاقة ذهنية", value: 28, color: "#6A9C89" },
  { name: "صعوبات تعلّم", value: 22, color: "#D9A441" },
  { name: "إعاقة حركية", value: 14, color: "#3E8E6B" },
  { name: "أخرى", value: 9, color: "#C9D2CD" },
];

const recentCases = [
  { name: "ليان عبدالله", id: "SC-2026-000142", age: 7, status: "نشط", specialist: "د. سلمى" },
  { name: "يوسف خالد", id: "SC-2026-000141", age: 9, status: "نشط", specialist: "د. أحمد" },
  { name: "ريم محمد", id: "SC-2026-000140", age: 5, status: "متابعة", specialist: "د. نورة" },
];

export function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="absolute inset-0 -m-8 rounded-[2rem] bg-gradient-to-br from-primary/5 to-transparent blur-2xl" aria-hidden />
      <div className="relative rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
        {/* Mock window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-danger/40" />
            <span className="h-3 w-3 rounded-full bg-warning/40" />
            <span className="h-3 w-3 rounded-full bg-success/40" />
          </div>
          <div className="flex-1 text-center text-xs text-muted">specialcare.app/dashboard</div>
        </div>

        {/* Mock app content */}
        <div className="grid grid-cols-12 min-h-[500px]">
          {/* Mock sidebar */}
          <aside className="col-span-3 border-e border-border p-4 hidden md:block bg-surface">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Special Care</p>
                <p className="text-[10px] text-muted">مركز الأمل</p>
              </div>
            </div>
            <nav className="space-y-1">
              {[
                { label: "لوحة التحكم", active: true },
                { label: "الحالات" },
                { label: "المتابعات" },
                { label: "التقارير" },
                { label: "المستخدمون" },
              ].map((i) => (
                <div
                  key={i.label}
                  className={`text-xs px-3 py-2 rounded-lg ${i.active ? "bg-primary/10 text-primary font-semibold" : "text-muted"}`}
                >
                  {i.label}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main preview */}
          <div className="col-span-12 md:col-span-9 p-5 lg:p-6 bg-background">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-base font-bold text-ink">مرحبًا، أحمد 👋</p>
                <p className="text-xs text-muted mt-0.5">نظرة سريعة على الحالات والمتابعات</p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                { label: "إجمالي الحالات", value: "142", tone: "bg-primary/10 text-primary", Icon: Users2 },
                { label: "حالات نشطة", value: "98", tone: "bg-success/10 text-success", Icon: Activity },
                { label: "حالات جديدة", value: "12", tone: "bg-warning/10 text-warning", Icon: TrendingUp },
                { label: "متابعات قادمة", value: "27", tone: "bg-accent/10 text-accent", Icon: CalendarCheck },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-start justify-between">
                    <p className="text-[11px] text-muted">{s.label}</p>
                    <div className={`h-6 w-6 rounded-md flex items-center justify-center ${s.tone}`}>
                      <s.Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-ink mt-1.5 tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-12 gap-3 mb-5">
              <div className="col-span-12 lg:col-span-8 rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-ink">نظرة عامة على الحالات</p>
                  <span className="text-[10px] text-muted">آخر 7 أشهر</span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16423C" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#16423C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#6B7773" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#6B7773" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E9E6" }} />
                      <Area type="monotone" dataKey="cases" stroke="#16423C" strokeWidth={2} fill="url(#g1)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-4 rounded-xl border border-border bg-surface p-4">
                <p className="text-sm font-semibold text-ink mb-3">حسب الإعاقة</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={disabilityData} dataKey="value" innerRadius={28} outerRadius={50} paddingAngle={2}>
                        {disabilityData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  {disabilityData.slice(0, 3).map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-muted">
                        <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-semibold text-ink tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent cases table */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <p className="text-sm font-semibold text-ink">أحدث الحالات</p>
                <span className="text-xs text-primary flex items-center gap-1">
                  عرض الكل <ChevronLeft className="h-3 w-3" />
                </span>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-background text-muted">
                  <tr>
                    <th className="px-4 py-2 text-start font-medium">الاسم</th>
                    <th className="px-4 py-2 text-start font-medium hidden lg:table-cell">الرقم</th>
                    <th className="px-4 py-2 text-start font-medium">العمر</th>
                    <th className="px-4 py-2 text-start font-medium hidden md:table-cell">الأخصائي</th>
                    <th className="px-4 py-2 text-start font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentCases.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2.5 text-ink font-medium">{c.name}</td>
                      <td className="px-4 py-2.5 text-muted hidden lg:table-cell tabular-nums">{c.id}</td>
                      <td className="px-4 py-2.5 text-ink tabular-nums">{c.age}</td>
                      <td className="px-4 py-2.5 text-muted hidden md:table-cell">{c.specialist}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex rounded-full bg-success/10 text-success px-2 py-0.5 text-[10px] font-medium">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
