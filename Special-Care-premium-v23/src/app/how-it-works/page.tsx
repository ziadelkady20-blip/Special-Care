import PublicLayout from "@/components/public-layout";
import { ClipboardCheck, UserPlus, LineChart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      n: "01",
      icon: UserPlus,
      title: "أنشئ حساب مركزك",
      desc: "يبدأ المدير بإعداد المركز وإضافة أعضاء الفريق بصلاحيات مناسبة لكل دور.",
      details: ["إضافة الأخصائيين والموظفين", "تحديد الأدوار والصلاحيات", "إعداد الخدمات والتصنيفات"],
    },
    {
      n: "02",
      icon: ClipboardCheck,
      title: "سجّل الحالات بسهولة",
      desc: "خطوات منظّمة لإدخال بيانات الطفل، العائلة، التشخيص، والخدمات بشكل كامل ودقيق.",
      details: ["معالج متعدد الخطوات", "تحقق تلقائي من البيانات", "رقم حالة فريد لكل طفل"],
    },
    {
      n: "03",
      icon: LineChart,
      title: "تابع، قيّم، وقرّر",
      desc: "أضف المتابعات الدورية، تابع التقدم عبر الخط الزمني، واطّلع على الإحصائيات لاتخاذ قرارات مدروسة.",
      details: ["خط زمني لكل حالة", "لوحات تحكم تفاعلية", "تصدير التقارير بصيغ متعددة"],
    },
  ];

  return (
    <PublicLayout>
      <section className="py-20 bg-surface border-b border-border">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold text-primary mb-2">كيف تعمل المنصة</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">
            ثلاث خطوات، منصة متكاملة
          </h1>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            تصميم بسيط يمكّن فريقك من البدء خلال دقائق دون تعقيد.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6 space-y-10">
          {steps.map((s, idx) => (
            <div
              key={s.n}
              className="grid md:grid-cols-12 gap-6 items-start rounded-2xl border border-border bg-surface p-6 lg:p-8"
            >
              <div className="md:col-span-4">
                <p className="text-5xl font-bold text-primary/20 tabular-nums">{s.n}</p>
                <div className="mt-3 h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-ink">{s.title}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{s.desc}</p>
              </div>
              <div className="md:col-span-8">
                <ul className="space-y-2">
                  {s.details.map((d) => (
                    <li key={d} className="flex items-start gap-3 rounded-xl bg-background p-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-sm text-ink">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-background border-t border-border">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">جاهز للبدء؟</h2>
          <p className="mt-2 text-muted">انضم إلى المراكز التي تستخدم Special Care لإدارة حالاتها بذكاء.</p>
          <Link href="/login" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-medium text-white hover:bg-primary/90 shadow-sm mt-6">
            ابدأ الآن <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
