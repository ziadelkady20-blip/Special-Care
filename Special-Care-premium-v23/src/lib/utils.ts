import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = d.getTime() - Date.now();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "اليوم";
  if (days === 1) return "غدًا";
  if (days === -1) return "أمس";
  if (days > 1 && days <= 7) return `خلال ${days} أيام`;
  if (days < -1 && days >= -7) return `منذ ${Math.abs(days)} أيام`;
  return formatDate(value);
}

export function genderLabel(g: string): string {
  return g === "MALE" ? "ذكر" : "أنثى";
}

export const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  ON_HOLD: "معلّق",
  CLOSED: "مغلق",
  ARCHIVED: "مؤرشف",
  DISABLED: "معطّل",
  SUSPENDED: "موقوف",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
  PAUSED: "متوقف",
  MILD: "خفيف",
  MODERATE: "متوسط",
  SEVERE: "شديد",
  PROFOUND: "عميق",
  IMPROVING: "يتحسّن",
  STABLE: "مستقر",
  DECLINING: "يتراجع",
  NEEDS_REVIEW: "يحتاج مراجعة",
  LOW: "منخفض",
  NORMAL: "عادي",
  HIGH: "مرتفع",
  URGENT: "طارئ",
  MARRIED: "متزوّج",
  DIVORCED: "مطلّق",
  SEPARATED: "منفصل",
  WIDOWED: "أرمل",
  SINGLE: "أعزب",
};

export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "مدير عام",
  CENTER_ADMIN: "مدير مركز",
  SPECIALIST: "أخصائي",
  DATA_ENTRY: "إدخال بيانات",
  VIEWER: "مشاهد",
};

export const progressColor: Record<string, string> = {
  IMPROVING: "bg-success/10 text-success",
  STABLE: "bg-primary-light/10 text-primary",
  DECLINING: "bg-danger/10 text-danger",
  NEEDS_REVIEW: "bg-warning/10 text-warning",
};

export const statusColor: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  ON_HOLD: "bg-warning/10 text-warning",
  CLOSED: "bg-muted/10 text-muted",
  ARCHIVED: "bg-muted/10 text-muted",
  DISABLED: "bg-danger/10 text-danger",
  COMPLETED: "bg-success/10 text-success",
  CANCELLED: "bg-danger/10 text-danger",
  PAUSED: "bg-warning/10 text-warning",
};

export const priorityColor: Record<string, string> = {
  LOW: "bg-muted/10 text-muted",
  NORMAL: "bg-primary-light/10 text-primary",
  HIGH: "bg-warning/10 text-warning",
  URGENT: "bg-danger/10 text-danger",
};
