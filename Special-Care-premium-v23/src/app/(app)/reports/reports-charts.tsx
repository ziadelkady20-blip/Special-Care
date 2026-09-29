"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

const COLORS = ["#16423C", "#6A9C89", "#D9A441", "#3E8E6B", "#C94C4C", "#C9D2CD", "#17211F"];

export function ReportsCharts({
  byStatus,
  byGender,
  bySpecialist,
}: {
  byStatus: { name: string; value: number }[];
  byGender: { name: string; value: number }[];
  bySpecialist: { name: string; value: number }[];
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 md:col-span-6">
        <CardHeader>
          <CardTitle>الحالات حسب الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {byStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E9E6" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {byStatus.map((s, i) => (
              <span key={s.name} className="text-xs text-muted inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-12 md:col-span-6">
        <CardHeader>
          <CardTitle>التوزيع حسب الجنس</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byGender}>
                <CartesianGrid stroke="#E5E9E6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7773" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7773" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E9E6" }} />
                <Bar dataKey="value" name="عدد الحالات" fill="#16423C" radius={[8, 8, 0, 0]} maxBarSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>الحالات حسب الأخصائي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySpecialist} layout="vertical">
                <CartesianGrid stroke="#E5E9E6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7773" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#6B7773" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E9E6" }} />
                <Bar dataKey="value" name="عدد الحالات" fill="#6A9C89" radius={[0, 8, 8, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
