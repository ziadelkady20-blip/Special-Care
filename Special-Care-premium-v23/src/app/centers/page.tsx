import Link from "next/link";
import { Building2, MapPin, ArrowLeft, Clock3, Phone } from "lucide-react";
import { db } from "@/db";
import { centers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EmptyState } from "@/components/ui";

export default async function CentersPage() {
  const rows = await db.select().from(centers).where(eq(centers.status, "ACTIVE"));
  return (
    <main className="min-h-screen bg-background px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Special Care
          </Link>
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <Building2 className="h-3.5 w-3.5 text-primary" /> {rows.length} مركز نشط
          </span>
        </div>

        <div className="mt-10 max-w-3xl">
          <p className="text-sm text-primary font-semibold">دليل المراكز</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mt-2 text-balance">اختر المركز المناسب لطفلك</h1>
          <p className="text-muted mt-3 leading-7">استكشف المراكز المسجلة على Special Care، وتعرّف على خدماتها وبياناتها قبل الانضمام. يمكنك بعد ذلك اختيار المركز وربط ملف طفلك به.</p>
        </div>

        {rows.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface">
            <EmptyState icon={Building2} title="لا توجد مراكز متاحة حاليًا" description="سيظهر هنا أي مركز يتم اعتماده وإتاحته على المنصة." action={<Link href="/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white">العودة للرئيسية</Link>} />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {rows.map((center) => (
              <Link key={center.id} href={`/centers/${center.slug ?? center.id}`} className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="h-40 bg-primary/[0.06] overflow-hidden relative">
                  {center.coverImage ? <img src={center.coverImage} alt={`صورة ${center.name}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="h-full flex items-center justify-center"><Building2 className="h-10 w-10 text-primary/30" /></div>}
                  <span className="absolute top-3 end-3 rounded-full bg-surface/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-success">مركز نشط</span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><h2 className="font-bold text-lg text-ink">{center.name}</h2><p className="text-sm text-muted mt-2 line-clamp-2 leading-6">{center.description ?? "مركز رعاية وتأهيل مسجل على Special Care."}</p></div>
                    <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><ArrowLeft className="h-4 w-4" /></span>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-muted">
                    <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" />{center.address ?? "العنوان غير مضاف"}</p>
                    {center.phone ? <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" />{center.phone}</p> : null}
                    {center.workingHours ? <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-primary" />{center.workingHours}</p> : null}
                  </div>
                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">عرض تفاصيل المركز</span>
                    <ArrowLeft className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
