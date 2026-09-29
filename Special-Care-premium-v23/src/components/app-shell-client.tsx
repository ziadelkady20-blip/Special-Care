"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X, Menu } from "lucide-react";
import { BrandLockup } from "./brand-mark";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[];
}

const roleLabels: Record<AppRole, string> = {
  SUPER_ADMIN: "مدير عام",
  CENTER_ADMIN: "مدير مركز",
  SPECIALIST: "أخصائي",
  DATA_ENTRY: "إدخال بيانات",
  VIEWER: "مشاهد",
};

export function AppSidebarClient({ nav, user, children }: { nav: NavItem[]; user: { id: string; name: string; role: AppRole }; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => { setOpen(false); }, [pathname]);
  return <>
    <div className="lg:hidden fixed top-0 start-0 z-30 ps-3 pt-3"><button onClick={() => setOpen(true)} className="h-10 w-10 rounded-lg bg-surface border border-border shadow-sm flex items-center justify-center text-ink" aria-label="فتح القائمة"><Menu className="h-5 w-5" /></button></div>
    {open ? <><div className="lg:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} /><aside className="lg:hidden fixed inset-y-0 start-0 z-50 w-72 bg-surface border-e border-border flex flex-col animate-slide-in-right"><div className="h-16 flex items-center justify-between px-5 border-b border-border"><BrandLockup compact /><button onClick={() => setOpen(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:bg-background" aria-label="إغلاق"><X className="h-4 w-4" /></button></div><nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">{nav.map((item) => { const active = pathname === item.href || pathname.startsWith(item.href + "/"); return <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-primary/10 text-primary" : "text-muted hover:text-ink hover:bg-background")}><item.icon className="h-4 w-4" /><span className="flex-1">{item.label}</span></Link>; })}</nav><div className="border-t border-border p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">{user.name.slice(0, 1)}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink truncate">{user.name}</p><p className="text-xs text-muted truncate">{roleLabels[user.role]}</p></div><LogoutButton compact /></div></div></aside></> : null}
    <style>{`@media (min-width: 1024px) { .desktop-nav-link[data-active="true"] { background-color: rgba(22, 66, 60, 0.08); color: #16423c; } }`}</style>
    <DesktopActiveStyles pathname={pathname} />
    {children}
  </>;
}

function DesktopActiveStyles({ pathname }: { pathname: string }) {
  React.useEffect(() => { const links = document.querySelectorAll<HTMLAnchorElement>(".desktop-nav-link"); links.forEach((l) => { const href = l.getAttribute("href") ?? ""; const active = pathname === href || (href !== "/" && pathname.startsWith(href + "/")); l.dataset.active = active ? "true" : "false"; }); }, [pathname]);
  return null;
}

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return <button type="button" onClick={() => void signOut({ callbackUrl: "/login" })} className={compact ? "h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:bg-background hover:text-danger" : "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-background hover:text-danger"} aria-label="تسجيل الخروج"><LogOut className="h-4 w-4" />{!compact ? <span>تسجيل الخروج</span> : null}</button>;
}
