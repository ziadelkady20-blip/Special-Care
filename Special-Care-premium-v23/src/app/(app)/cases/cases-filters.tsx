"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui";
import { Filter, X } from "lucide-react";

interface Props {
  filters: {
    disabilityId?: string;
    gender?: string;
    status?: string;
    specialistId?: string;
    from?: string;
    to?: string;
    sort?: string;
  };
  reference: {
    specialists: { id: string; name: string }[];
    disabilities: { id: string; name: string }[];
  };
}

export function CasesFilters({ filters, reference }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    router.push(`/cases?${next.toString()}`);
  };

  const clear = () => router.push("/cases");

  const hasAny =
    filters.disabilityId || filters.gender || filters.status || filters.specialistId || filters.from || filters.to;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted flex items-center gap-1">
        <Filter className="h-3.5 w-3.5" />
        فلاتر:
      </span>

      <Select value={filters.disabilityId ?? "all"} onValueChange={(v) => set("disabilityId", v)}>
        <SelectTrigger className="h-9 text-xs w-auto min-w-[130px]">
          <SelectValue placeholder="الإعاقة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الإعاقات</SelectItem>
          {reference.disabilities.map((d) => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.gender ?? "all"} onValueChange={(v) => set("gender", v)}>
        <SelectTrigger className="h-9 text-xs w-auto min-w-[110px]">
          <SelectValue placeholder="الجنس" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">الكل</SelectItem>
          <SelectItem value="MALE">ذكر</SelectItem>
          <SelectItem value="FEMALE">أنثى</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.status ?? "all"} onValueChange={(v) => set("status", v)}>
        <SelectTrigger className="h-9 text-xs w-auto min-w-[120px]">
          <SelectValue placeholder="الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">الكل</SelectItem>
          <SelectItem value="ACTIVE">نشط</SelectItem>
          <SelectItem value="ON_HOLD">معلّق</SelectItem>
          <SelectItem value="CLOSED">مغلق</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.specialistId ?? "all"} onValueChange={(v) => set("specialistId", v)}>
        <SelectTrigger className="h-9 text-xs w-auto min-w-[130px]">
          <SelectValue placeholder="الأخصائي" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">الكل</SelectItem>
          {reference.specialists.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <input
        type="date"
        value={filters.from ?? ""}
        onChange={(e) => set("from", e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2 text-xs"
        aria-label="من تاريخ"
      />
      <input
        type="date"
        value={filters.to ?? ""}
        onChange={(e) => set("to", e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2 text-xs"
        aria-label="إلى تاريخ"
      />

      {hasAny ? (
        <Button variant="ghost" size="sm" onClick={clear} className="text-xs text-muted">
          <X className="h-3.5 w-3.5" />
          مسح الفلاتر
        </Button>
      ) : null}
    </div>
  );
}
