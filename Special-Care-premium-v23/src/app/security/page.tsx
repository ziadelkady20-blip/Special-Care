import PublicLayout from "@/components/public-layout";
import {
  Lock,
  Database,
  KeyRound,
  ShieldCheck,
  UserCheck,
  FileCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function SecurityPage() {
  const pillars = [
    { icon: Lock, title: "تشفير كلمات المرور", desc: "نستخدم bcrypt مع معاملات تكلفة عالية لحماية كلمات المرور من أي هجمات." },
    { icon: KeyRound, title: "جلسات آمنة (JWT)", desc: "جلسات قصيرة المدى، موقّعة، ومخزّنة في كوكيز HttpOnly لا يمكن الوصول إليها عبر JavaScript." },
    { icon: Database, title: "عزل بيانات المراكز", desc: "كل مركز معزول عن الآخر تمامًا — لا يمكن لأي مستخدم الوصول إلى بيانات مركز آخر." },
    { icon: UserCheck, title: "صلاحيات على مستوى الخادم", desc: "التحقق من الصلاحيات يتم على الخادم دائمًا، وليس فقط بإخفاء الواجهة." },
    { icon: FileCheck, title: "التحقق من الملفات", desc: "فحص نوع الملف (MIME)، الامتداد، والحجم قبل قبول أي رفع لمنع الملفات الخبيثة." },
    { icon: Activity, title: "سجل التدقيق", desc: "تسجيل كل العمليات الحساسة مع المستخدم، الوقت، والقيم السابقة والجديدة." },
    { icon: ShieldCheck, title: "حماية من الهجمات", desc: "تطبيق أفضل ممارسات OWASP: CSRF، XSS، SQL Injection، وغيرها." },
    { icon: AlertTriangle, title: "معالجة آمنة للأخطاء", desc: "لا نكشف تفاصيل حساسة في رسائل الخطأ، ونسجّل كل شيء داخليًا للمراجعة." },
  ];

  return (
    <PublicLayout>
      <section className="py-20 bg-surface border-b border-border">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold text-primary mb-2">الأمان والخصوصية</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">
            حماية بيانات الأطفال مسؤولية لا نتهاون فيها
          </h1>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            بنينا المنصة وفق أعلى معايير الأمان لأننا نتعامل مع بيانات حسّاسة تستحق الحماية القصوى.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-surface p-5">
                <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink">{p.title}</h3>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-background border-t border-border">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-ink mb-6">التزامنا</h2>
          <ul className="space-y-3">
            {[
              "عدم مشاركة بياناتك مع أي طرف ثالث",
              "إتاحة حذف بيانات الحالات عند الطلب",
              "تحديث المكتبات والأنظمة باستمرار لسد الثغرات",
              "نسخ احتياطية دورية مشفّرة",
              "تدريب مستمر للفريق على أفضل ممارسات الأمان",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-ink">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PublicLayout>
  );
}
