import PublicLayout, { FeatureBlock } from "@/components/public-layout";
import {
  Users2,
  CalendarCheck,
  FileText,
  BarChart3,
  ShieldCheck,
  UserCheck,
  Upload,
  Search,
  Bell,
  ClipboardList,
  Timer,
  Layers,
} from "lucide-react";

export default function FeaturesPage() {
  const features = [
    { icon: Users2, title: "إدارة شاملة للحالات", description: "تسجيل بيانات الطفل، العائلة، التشخيص، والخدمات الحالية في ملف واحد منظم." },
    { icon: ClipboardList, title: "ملفات منظمة", description: "خطوات واضحة لإدخال المعلومات دون ضياع أو تكرار." },
    { icon: CalendarCheck, title: "متابعات دورية", description: "سجّل كل متابعة مع التقييم، الملاحظات، والتوصيات في خط زمني متكامل." },
    { icon: FileText, title: "تقارير ومرفقات", description: "رفع التقارير الطبية والوثائق مع تصنيف ذكي ووصول سريع." },
    { icon: BarChart3, title: "إحصائيات تفاعلية", description: "لوحات تحكم تعرض أهم المؤشرات والتوزيعات لفهم أعمق للأداء." },
    { icon: Search, title: "بحث وفلترة متقدمة", description: "ابحث عن أي حالة أو معلومة بثوانٍ باستخدام فلاتر دقيقة." },
    { icon: UserCheck, title: "أدوار وصلاحيات", description: "تحكم كامل في صلاحيات كل عضو حسب دوره في المركز." },
    { icon: Bell, title: "إشعارات ذكية", description: "تنبيهات بالمتابعات القادمة، الحالات الجديدة، والمهام المهمة." },
    { icon: ShieldCheck, title: "أمان على مستوى المؤسسات", description: "تشفير، عزل، وسجل تدقيق لحماية البيانات الحساسة." },
    { icon: Timer, title: "توفير الوقت", description: "واجهات سريعة وأتمتة للعمليات المتكررة تقلل الجهد اليدوي." },
    { icon: Upload, title: "تصدير مرن", description: "صدّر البيانات والتقارير بصيغ CSV و Excel و PDF." },
    { icon: Layers, title: "تجربة متكاملة", description: "من التسجيل حتى التقرير النهائي، كل شيء في مكان واحد." },
  ];

  return (
    <PublicLayout>
      <section className="py-20 bg-surface border-b border-border">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold text-primary mb-2">المميزات</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">
            كل الأدوات التي يحتاجها مركزك
          </h1>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            مجموعة متكاملة من المصممة خصيصًا لتبسيط عمل الأخصائيين وتحسين جودة الرعاية.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <FeatureBlock key={f.title} {...f} />
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
