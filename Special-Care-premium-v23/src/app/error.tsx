"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-6" dir="rtl">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-primary">Special Care</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-muted">حاول إعادة تحميل الصفحة. إذا استمرت المشكلة، راجع سجلات الخادم.</p>
        <button onClick={() => reset()} className="mt-6 h-10 rounded-lg bg-primary px-5 text-sm font-medium text-white">إعادة المحاولة</button>
      </div>
    </div>
  );
}
