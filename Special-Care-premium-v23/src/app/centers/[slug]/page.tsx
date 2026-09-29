import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { centers, parentChildren, children } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { getCurrentAppUser } from "@/lib/session";
import { joinCenter } from "@/app/actions";

async function submitJoinCenter(formData: FormData) {
  "use server";
  await joinCenter(formData);
}

export default async function CenterProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [center] = await db.select().from(centers).where(or(eq(centers.slug, slug), eq(centers.id, slug))).limit(1);
  if (!center || center.status !== "ACTIVE") notFound();
  const session = await getCurrentAppUser();
  const parentKids = session?.accountType === "PARENT" && session.parentId ? await db.select({ id: children.id, firstName: children.firstName, lastName: children.lastName }).from(parentChildren).innerJoin(children, eq(parentChildren.childId, children.id)).where(eq(parentChildren.parentId, session.parentId)) : [];
  return <main className="min-h-screen bg-background px-6 py-10"><div className="max-w-5xl mx-auto"><Link href="/centers" className="text-sm text-primary">← كل المراكز</Link><div className="mt-8 rounded-3xl overflow-hidden border border-border bg-surface"><div className="h-64 bg-primary/10">{center.coverImage ? <img src={center.coverImage} alt="" className="w-full h-full object-cover" /> : null}</div><div className="p-7"><div className="flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-3xl font-bold text-ink">{center.name}</h1><p className="text-muted mt-2">{center.description ?? "مركز متخصص في خدمات الرعاية والتأهيل."}</p></div>{session?.accountType === "PARENT" && parentKids.length ? <form action={submitJoinCenter} className="flex flex-wrap gap-2 items-center"><select name="childId" className="rounded-xl border border-border px-3 py-3 bg-surface">{parentKids.map(k=><option key={k.id} value={k.id}>{k.firstName} {k.lastName}</option>)}</select><input type="hidden" name="centerId" value={center.id}/><button className="rounded-xl bg-primary text-white px-5 py-3 font-semibold">انضمام للمركز</button></form> : <Link href={session?.accountType === "PARENT" ? "/parent" : "/register"} className="rounded-xl bg-primary text-white px-5 py-3 font-semibold">{session?.accountType === "PARENT" ? "أضف طفلاً أولاً" : "أنشئ حساب ولي أمر"}</Link>}</div><div className="grid md:grid-cols-3 gap-4 mt-8"><div className="rounded-xl bg-background p-4"><p className="text-xs text-muted">العنوان</p><p className="font-semibold mt-1">{center.address ?? "—"}</p></div><div className="rounded-xl bg-background p-4"><p className="text-xs text-muted">الهاتف</p><p className="font-semibold mt-1">{center.phone ?? "—"}</p></div><div className="rounded-xl bg-background p-4"><p className="text-xs text-muted">مواعيد العمل</p><p className="font-semibold mt-1">{center.workingHours ?? "—"}</p></div></div></div></div></div></main>;
}
