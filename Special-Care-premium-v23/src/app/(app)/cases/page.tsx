import { requireSession } from "@/lib/session";
import { listCases, getReferenceData } from "@/lib/queries";
import { canCreateCases } from "@/lib/auth";
import Link from "next/link";
import { Plus, Search, Filter, Download, User, Calendar } from "lucide-react";
import { Button, Card, Badge, PageHeader, EmptyState, SearchInput } from "@/components/ui";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { calculateAge, genderLabel, statusLabels, statusColor, priorityColor, formatDate } from "@/lib/utils";
import { CasesFilters } from "./cases-filters";

export const dynamic = "force-dynamic";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const ref = await getReferenceData(session.user.centerId);

  const filters = {
    search: typeof params.search === "string" ? params.search : undefined,
    disabilityId: typeof params.disabilityId === "string" ? params.disabilityId : undefined,
    gender: (typeof params.gender === "string" ? params.gender : undefined) as any,
    status: (typeof params.status === "string" ? params.status : undefined) as any,
    specialistId: typeof params.specialistId === "string" ? params.specialistId : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
    sort: (typeof params.sort === "string" ? params.sort : "newest") as any,
    page: typeof params.page === "string" ? parseInt(params.page) : 1,
    pageSize: 10,
  };

  const result = await listCases(session.user.centerId, filters);

  type Row = (typeof result.rows)[number];
  const columns: DataTableColumn<Row>[] = [
    {
      id: "caseNumber",
      header: "رقم الحالة",
      cell: (r) => <span className="font-mono text-xs text-primary">{r.caseNumber}</span>,
    },
    {
      id: "name",
      header: "الاسم",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {r.firstName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">
              {r.firstName} {r.lastName}
            </p>
            <p className="text-xs text-muted">{genderLabel(r.gender)}</p>
          </div>
        </div>
      ),
    },
    {
      id: "age",
      header: "العمر",
      cell: (r) => <span className="tabular-nums">{calculateAge(r.dateOfBirth)} سنة</span>,
      hideOnMobile: true,
    },
    {
      id: "diagnosis",
      header: "التشخيص",
      cell: (r) => (
        <span className="text-xs text-muted truncate max-w-[180px] block" title={r.primaryDiagnosis ?? ""}>
          {r.primaryDiagnosis ?? "—"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: "specialist",
      header: "الأخصائي",
      cell: (r) => (
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <User className="h-3 w-3" />
          {r.specialistName ?? "—"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: "status",
      header: "الحالة",
      cell: (r) => (
        <div className="flex flex-col gap-1">
          <Badge variant={r.status === "ACTIVE" ? "success" : r.status === "ON_HOLD" ? "warning" : "muted"}>
            {statusLabels[r.status] ?? r.status}
          </Badge>
          {r.priority !== "NORMAL" ? (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium w-fit ${priorityColor[r.priority]}`}>
              {statusLabels[r.priority] ?? r.priority}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "lastFollowUp",
      header: "آخر متابعة",
      cell: (r) => (
        <span className="flex items-center gap-1 text-xs text-muted tabular-nums">
          <Calendar className="h-3 w-3" />
          {r.lastFollowUp ? formatDate(r.lastFollowUp) : "—"}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  const canCreate = canCreateCases(session.user.role);

  const qs = (override: Record<string, string | undefined>) => {
    const merged = { ...params, ...override };
    const entries = Object.entries(merged).filter(([, v]) => v !== undefined && v !== "");
    return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
  };

  return (
    <>
      <PageHeader
        title="الحالات"
        subtitle="إدارة ومتابعة جميع الحالات المسجلة."
        actions={
          canCreate ? (
            <Link href="/cases/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 shadow-sm">
              <Plus className="h-4 w-4" />
              إضافة حالة
            </Link>
          ) : undefined
        }
      />

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <form action="/cases" method="GET">
              {/* preserve other filters via hidden inputs */}
              {Object.entries(params).map(([k, v]) =>
                k === "search" || k === "page" ? null : (
                  <input key={k} type="hidden" name={k} value={String(v)} />
                ),
              )}
              <div className="flex gap-2">
                <input
                  name="search"
                  defaultValue={filters.search}
                  placeholder="ابحث بالاسم أو رقم الحالة..."
                  className="flex-1 h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary-light/20"
                />
                <Button type="submit" variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
          <div className="md:col-span-8">
            <CasesFilters filters={filters} reference={ref} />
          </div>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={result.rows}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => {
            window.location.href = `/cases/${r.id}`;
          }}
          empty={
            <EmptyState
              title="لا توجد حالات"
              description="لم يتم العثور على حالات مطابقة للبحث الحالي."
              action={
                canCreate ? (
                  <Link href="/cases/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 shadow-sm">
                    <Plus className="h-4 w-4" />
                    إضافة حالة جديدة
                  </Link>
                ) : undefined
              }
            />
          }
          pagination={{
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
            onPageChange: (p) => {
              window.location.href = `/cases${qs({ page: String(p) })}`;
            },
          }}
        />
      </Card>
    </>
  );
}
