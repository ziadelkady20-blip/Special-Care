import { HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return <span className={cn("relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-primary text-white shadow-[0_8px_24px_rgba(22,66,60,0.16)]", className)}><span className="absolute -end-2 -top-2 h-7 w-7 rounded-full bg-accent/90" aria-hidden="true" /><HeartHandshake className={cn("relative z-10 h-5 w-5", iconClassName)} strokeWidth={1.8} /></span>;
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3"><BrandMark className={compact ? "h-9 w-9 rounded-xl" : undefined} iconClassName={compact ? "h-4 w-4" : undefined} /><div className="min-w-0 leading-none"><p className={cn("font-bold tracking-[-0.02em] text-ink", compact ? "text-sm" : "text-base")}>SPECIAL CARE</p>{!compact ? <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-muted">Smart Case Management</p> : null}</div></div>;
}
