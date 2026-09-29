"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const progressLabels: Record<string,string> = { IMPROVING:"يتحسن", STABLE:"مستقر", DECLINING:"يتراجع", NEEDS_REVIEW:"يحتاج مراجعة" };
const serviceLabels: Record<string,string> = { ACTIVE:"نشطة", COMPLETED:"مكتملة", PAUSED:"متوقفة مؤقتًا", CANCELLED:"ملغاة" };

export function ProgressAnalytics({ data }: { data: any }) {
  const progress = data.progress.map((x:any)=>({name:progressLabels[x.progress] ?? x.progress,value:Number(x.total)}));
  const services = data.serviceStatus.map((x:any)=>({name:serviceLabels[x.status] ?? x.status,value:Number(x.total)}));
  const specialist = data.specialistLoad.map((x:any)=>({name:x.name,value:Number(x.total)}));
  const serviceRows = data.serviceProgress.reduce((acc:any[], x:any)=>{
    let row=acc.find(r=>r.name===x.service_name); if(!row){row={name:x.service_name};acc.push(row);} row[progressLabels[x.progress]??x.progress]=Number(x.total); return acc;
  },[]);
  return <div className="mt-6 space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card><CardHeader><CardTitle>اتجاهات التقدم</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={progress}><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
      <Card><CardHeader><CardTitle>حالة الخدمات</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={services} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={82} label>{services.map((_:any,i:number)=><Cell key={i}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></CardContent></Card>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card><CardHeader><CardTitle>التقدم حسب الخدمة</CardTitle></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={serviceRows} layout="vertical"><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={110}/><Tooltip/><Bar dataKey="يتحسن" stackId="a"/><Bar dataKey="مستقر" stackId="a"/><Bar dataKey="يتراجع" stackId="a"/><Bar dataKey="يحتاج مراجعة" stackId="a"/></BarChart></ResponsiveContainer></div></CardContent></Card>
      <Card><CardHeader><CardTitle>توزيع المتابعات على الأخصائيين</CardTitle></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={specialist}><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div></CardContent></Card>
    </div>
    <Card className={data.overdueCases > 0 ? "border-warning/30 bg-warning/[0.04]" : ""}><CardContent className="p-5 flex items-center justify-between gap-4"><div><p className="font-semibold text-ink">حالات تحتاج تحديد متابعة قادمة</p><p className="text-xs text-muted mt-1">حالات نشطة لديها متابعة سابقة ولا يوجد لها موعد متابعة قادم.</p></div><div className="text-3xl font-bold text-ink tabular-nums">{data.overdueCases}</div></CardContent></Card>
  </div>;
}
