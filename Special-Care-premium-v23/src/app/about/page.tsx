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
  Lock,
  KeyRound,
  Database,
  Activity,
  ClipboardList,
  Timer,
  Globe,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <PublicLayout>
      <section className="py-20 bg-surface border-b border-border">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold text-primary mb-2">عن المنصة</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">
            صُمِّمت بعناية للمراكز التي تهتم فعلًا
          </h1>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            Special Care منصة متخصصة بُنيت من واقع فهم عميق لاحتياجات مراكز رعاية ذوي الاحتياجات الخاصة — بعيدًا عن القوالب الجاهزة والحلول العامة.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-semibold text-primary mb-2">قصتنا</p>
            <h2 className="text-3xl font-bold text-ink tracking-tight">
              من تحديات ميدانية إلى حل رقمي
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              لاحظنا كيف تعاني المراكز من جداول متناثرة، أوراق مفقودة، وصعوبة في متابعة تطور كل حالة. فقرّرنا بناء منصة واحدة تجمع كل شيء بشكل منظم وآمن.
            </p>
            <p className="mt-3 text-muted leading-relaxed">
              اليوم، تساعد المنصة فرق الأخصائيين على التركيز على الأهم: رعاية الطفل وتطوّره.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { n: "15+", l: "مركز يستخدم المنصة" },
              { n: "1200+", l: "حالة مُدارة" },
              { n: "98%", l: "رضا المستخدمين" },
              { n: "24/7", l: "دعم فني" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-3xl font-bold text-primary tabular-nums">{s.n}</p>
                <p className="text-xs text-muted mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-ink">قيمنا</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: ShieldCheck, t: "الثقة", d: "نضع أمان البيانات والخصوصية في صميم كل قرار." },
              { icon: Activity, t: "البساطة", d: "واجهات واضحة تساعد الفرق على الإنتاجية دون تعقيد." },
              { icon: Globe, t: "التأثير", d: "كل ميزة نبنيها تهدف لتحسين حياة الأطفال وأسرهم." },
            ].map((v) => (
              <div key={v.t} className="rounded-2xl border border-border bg-surface p-6">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-ink">{v.t}</h3>
                <p className="text-sm text-muted mt-1.5 leading-relaxed">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
