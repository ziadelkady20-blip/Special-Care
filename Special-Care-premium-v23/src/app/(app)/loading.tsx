export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="h-8 w-48 rounded-lg bg-border/60" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-surface border border-border" />)}
      </div>
      <div className="h-80 rounded-2xl bg-surface border border-border" />
    </div>
  );
}
