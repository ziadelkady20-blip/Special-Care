"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

const COLORS = ["#16423C", "#6A9C89", "#D9A441", "#3E8E6B", "#C94C4C", "#C9D2CD"];

export function DashboardCharts({
  monthly,
  byDisability,
  ageDistribution,
}: {
  monthly: { month: string; cases: number }[];
  byDisability: { name: string; value: number }[];
  ageDistribution: { bucket: string; total: number }[];
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 lg:col-span-7">
        <CardHeader>
          <CardTitle>نظرة عامة على الحالات</CardTitle>
          <p className="text-xs text-muted">تسجيل الحالات خلال آخر 7 أشهر</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="areaPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16423C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16423C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E9E6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7773" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7773" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #E5E9E6",
                    background: "white",
                  }}
                />
                <Area type="monotone" dataKey="cases" name="حالات" stroke="#16423C" strokeWidth={2} fill="url(#areaPrimary)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-5">
        <CardHeader>
          <CardTitle>حسب نوع الإعاقة</CardTitle>
          <p className="text-xs text-muted">توزيع الحالات على أنواع الإعاقات</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byDisability}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {byDisability.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #E5E9E6",
                    background: "white",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
            {byDisability.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted truncate">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  {d.name}
                </span>
                <span className="font-semibold text-ink tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>التوزيع العمري</CardTitle>
          <p className="text-xs text-muted">عدد الحالات في كل فئة عمرية</p>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistribution}>
                <CartesianGrid stroke="#E5E9E6" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: "#6B7773" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7773" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #E5E9E6",
                    background: "white",
                  }}
                />
                <Bar dataKey="total" name="عدد الحالات" fill="#6A9C89" radius={[8, 8, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
