import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center text-center" dir="rtl">
      <div>
        <p className="text-5xl font-bold text-primary">404</p>
        <h1 className="mt-3 text-xl font-bold text-ink">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-muted">الرابط الذي طلبته غير متاح أو تم نقله.</p>
        <Link href="/dashboard" className="inline-flex mt-5 h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-white">العودة للوحة التحكم</Link>
      </div>
    </div>
  );
}
