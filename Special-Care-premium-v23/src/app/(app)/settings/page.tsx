import { requireSession } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent, PageHeader, Badge } from "@/components/ui";
import { roleLabels } from "@/lib/utils";
import { User, Shield, Bell, Lock, Building2 } from "lucide-react";
import { db } from "@/db";
import { centers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ChangePasswordButton } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireSession();
  const [center] = await db.select().from(centers).where(eq(centers.id, session.user.centerId));
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone }).from(users).where(eq(users.id, session.user.id));

  return (
    <>
      <PageHeader title="الإعدادات" subtitle="إدارة حسابك ومعلومات المركز." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              الملف الشخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="الاسم" value={user.name} />
            <Field label="البريد" value={user.email} />
            <Field label="الجوال" value={user.phone ?? "—"} />
            <Field label="الدور" value={roleLabels[session.user.role] ?? session.user.role} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              المركز
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="الاسم" value={center.name} />
            <Field label="البريد" value={center.email ?? "—"} />
            <Field label="الهاتف" value={center.phone ?? "—"} />
            <Field label="العنوان" value={center.address ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              الأمان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm text-muted">
              نوصي باستخدام كلمة مرور قوية وتغييرها دوريًا. يمكنك تغيير كلمة المرور مباشرة من حسابك.
              </p>
              <ChangePasswordButton />
            </div>
            <Badge variant="outline" className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" />
              كلمة المرور مشفّرة باستخدام bcrypt
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {[
                "تنبيه قبل المتابعات القادمة",
                "إشعار عند تسجيل حالات جديدة",
                "إشعار عند رفع تقارير جديدة",
                "ملخص أسبوعي للنشاط",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink text-end">{value}</dd>
    </div>
  );
}
