import * as React from "react";
import { requireSession } from "@/lib/session";
import { getCaseDetail, getReferenceData } from "@/lib/queries";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  User,
  Users as UsersIcon,
  Stethoscope,
  Briefcase,
  CalendarCheck,
  FileText,
  Paperclip,
  Plus,
  MessageSquare,
  Clock,
  MapPin,
  Phone,
  Calendar,
  ShieldCheck,
  HeartPulse,
  ArrowLeft,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Timeline,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import {
  calculateAge,
  formatDate,
  genderLabel,
  statusLabels,
  statusColor,
  progressColor,
  priorityColor,
} from "@/lib/utils";
import { CaseDetailClient, AttachmentActions, ServiceLifecycleControl } from "./case-detail-client";
import { canDeleteDocuments } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const detail = await getCaseDetail(session.user.role === "SUPER_ADMIN" ? null : session.user.centerId, id);
  if (!detail) notFound();

  const { case: cs, child, family, diagnoses, services, followUps, reports, attachments, notes, assignedUser, parent, globalProfile } = detail;
  const ref = await getReferenceData(session.user.centerId);

  const fullName = `${child.firstName} ${child.middleName ?? ""} ${child.lastName}`.trim();
  const age = calculateAge(child.dateOfBirth);

  return (
    <CaseDetailClient
      caseData={detail}
      ref={ref}
      sessionUser={{ id: session.user.id, role: session.user.role }}
    >
      <div className="mb-4">
        <Link href="/cases" className="text-xs text-muted hover:text-primary inline-flex items-center gap-1">
          <ArrowRight className="h-3 w-3" />
          العودة للحالات
        </Link>
      </div>

      {/* Header */}
      <Card className="mb-6 overflow-hidden border-primary/10 p-0 shadow-sm">
        <div className="h-1.5 bg-gradient-to-l from-primary via-primary-light to-accent" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold flex-shrink-0">
            {child.firstName.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink">{fullName}</h1>
              <Badge variant={cs.status === "ACTIVE" ? "success" : cs.status === "ON_HOLD" ? "warning" : "muted"}>
                {statusLabels[cs.status] ?? cs.status}
              </Badge>
              {cs.priority !== "NORMAL" ? (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColor[cs.priority]}`}>
                  {statusLabels[cs.priority] ?? cs.priority}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1 font-mono">{cs.caseNumber}</span>
              <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{genderLabel(child.gender)} · {age} سنة</span>
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />سُجّلت {formatDate(cs.registrationDate)}</span>
              {assignedUser ? (
                <span className="inline-flex items-center gap-1"><Stethoscope className="h-3 w-3" />{assignedUser.name}</span>
              ) : null}
            </div>
          </div>
          </div>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-border pt-4">
            <MiniMetric label="التشخيصات" value={String(diagnoses.length)} icon={<HeartPulse className="h-3.5 w-3.5" />} />
            <MiniMetric label="الخدمات" value={String(services.length)} icon={<ShieldCheck className="h-3.5 w-3.5" />} />
            <MiniMetric label="المتابعات" value={String(followUps.length)} icon={<CalendarCheck className="h-3.5 w-3.5" />} />
            <MiniMetric label="المستندات" value={String(attachments.length + reports.length)} icon={<FileText className="h-3.5 w-3.5" />} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {child.phone ? <a href={`tel:${child.phone}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium text-ink hover:bg-background"><Phone className="h-3.5 w-3.5 text-primary" /> اتصال سريع</a> : null}
            {child.city ? <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-background px-3 text-xs text-muted"><MapPin className="h-3.5 w-3.5" /> {child.city}</span> : null}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start flex-wrap">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="family">الأسرة</TabsTrigger>
          <TabsTrigger value="diagnosis">التشخيص</TabsTrigger>
          <TabsTrigger value="services">الخدمات</TabsTrigger>
          <TabsTrigger value="followups">المتابعات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 p-5">
              <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                الخط الزمني للمتابعات
              </h3>
              {followUps.length === 0 ? (
                <EmptyState title="لا توجد متابعات بعد" description="أضف أول متابعة لبدء تتبع تطور الحالة." />
              ) : (
                <Timeline
                  items={followUps.map((f) => ({
                    date: f.followUpDate,
                    title: `متابعة بواسطة ${f.specialistName ?? "أخصائي"}`,
                    description: [
                      `الحالة: ${statusLabels[f.progress] ?? f.progress}`,
                      f.observations ? `الملاحظات: ${f.observations}` : "",
                      f.recommendations ? `التوصيات: ${f.recommendations}` : "",
                    ].filter(Boolean).join("\n"),
                    tone:
                      f.progress === "IMPROVING" ? "success" :
                      f.progress === "STABLE" ? "default" :
                      f.progress === "DECLINING" ? "danger" : "warning",
                  }))}
                />
              )}
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">ولي الأمر</h3>
                {parent ? <dl className="space-y-2 text-sm"><Row label="الاسم" value={parent.name} />{parent.phone ? <Row label="الهاتف" value={parent.phone} /> : null}{parent.email ? <Row label="البريد" value={parent.email} /> : null}</dl> : <p className="text-sm text-muted">لا يوجد حساب ولي أمر مرتبط بهذا الملف.</p>}
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">الملف الصحي العام</h3>
                <dl className="space-y-2 text-sm">
                  <Row label="التشخيص العام" value={globalProfile?.profile.diagnosisName ?? "—"} />
                  <Row label="نوع الإعاقة" value={globalProfile?.disabilityName ?? "—"} />
                  <Row label="درجة الحالة" value={globalProfile?.profile.severity ?? "—"} />
                </dl>
                {globalProfile?.profile.careSummary ? <p className="text-xs text-muted mt-3 leading-6">{globalProfile.profile.careSummary}</p> : null}
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">بيانات الطفل</h3>
                <dl className="space-y-2 text-sm">
                  <Row label="الاسم" value={fullName} />
                  <Row label="تاريخ الميلاد" value={formatDate(child.dateOfBirth)} />
                  <Row label="العمر" value={`${age} سنة`} />
                  <Row label="الجنس" value={genderLabel(child.gender)} />
                  {child.city ? <Row label="المدينة" value={child.city} /> : null}
                  {child.phone ? <Row label="الجوال" value={child.phone} /> : null}
                </dl>
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">التشخيص الحالي</h3>
                {diagnoses.length === 0 ? (
                  <p className="text-xs text-muted">—</p>
                ) : (
                  <ul className="space-y-2">
                    {diagnoses.slice(0, 3).map((d) => (
                      <li key={d.id} className="flex items-start justify-between gap-2 text-sm">
                        <div>
                          <p className="font-medium text-ink">{d.diagnosisName}</p>
                          <p className="text-xs text-muted">{formatDate(d.diagnosisDate)}</p>
                        </div>
                        <Badge
                          variant={d.severity === "MILD" ? "default" : d.severity === "MODERATE" ? "warning" : "danger"}
                        >
                          {statusLabels[d.severity] ?? d.severity}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="family">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary" />
              معلومات الأسرة
            </h3>
            {!family ? (
              <EmptyState title="لا توجد بيانات أسرة" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <Row label="اسم الأب" value={family.fatherName ?? "—"} />
                <Row label="جوال الأب" value={family.fatherPhone ?? "—"} />
                <Row label="اسم الأم" value={family.motherName ?? "—"} />
                <Row label="جوال الأم" value={family.motherPhone ?? "—"} />
                <Row label="الحالة الاجتماعية" value={family.maritalStatus ? (statusLabels[family.maritalStatus] ?? family.maritalStatus) : "—"} />
                <Row label="عدد أفراد الأسرة" value={family.familyMembersCount?.toString() ?? "—"} />
                <div className="md:col-span-2"><Row label="العنوان" value={family.address ?? "—"} /></div>
                {family.notes ? <div className="md:col-span-2"><Row label="ملاحظات" value={family.notes} /></div> : null}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="diagnosis">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">التشخيصات ({diagnoses.length})</h3>
            {diagnoses.length === 0 ? (
              <EmptyState title="لا توجد تشخيصات" />
            ) : (
              <div className="space-y-3">
                {diagnoses.map((d) => (
                  <div key={d.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink">{d.diagnosisName}</p>
                        <p className="text-xs text-muted mt-1">
                          {d.disabilityName} · {formatDate(d.diagnosisDate)}
                          {d.diagnosedBy ? ` · شخّص بواسطة ${d.diagnosedBy}` : ""}
                        </p>
                        {d.notes ? <p className="text-sm text-muted mt-2">{d.notes}</p> : null}
                      </div>
                      <Badge variant={d.severity === "MILD" ? "default" : d.severity === "MODERATE" ? "warning" : "danger"}>
                        {statusLabels[d.severity]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">الخدمات الحالية ({services.length})</h3>
            {services.length === 0 ? (
              <EmptyState title="لا توجد خدمات" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map((s) => (
                  <div key={s.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink">{s.serviceName}</p>
                        <p className="text-xs text-muted mt-1">
                          {formatDate(s.startDate)}{s.endDate ? ` — ${formatDate(s.endDate)}` : " — مستمر"}
                        </p>
                        {s.specialistName ? <p className="text-xs text-muted">الأخصائي: {s.specialistName}</p> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <ServiceLifecycleControl serviceId={s.id} currentStatus={s.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="followups">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">المتابعات ({followUps.length})</h3>
            </div>
            {followUps.length === 0 ? (
              <EmptyState title="لا توجد متابعات" description="أضف أول متابعة من خلال الزر أعلاه." />
            ) : (
              <div className="space-y-3">
                {followUps.map((f) => (
                  <div key={f.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                          {f.specialistName?.slice(0, 1) ?? "أ"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink">{f.specialistName ?? "أخصائي"}</p>
                          {f.caseServiceId ? <p className="text-[11px] text-muted">مرتبطة بخدمة الحالة</p> : null}
                          <p className="text-xs text-muted tabular-nums">{formatDate(f.followUpDate)}</p>
                        </div>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${progressColor[f.progress]}`}>
                        {statusLabels[f.progress]}
                      </span>
                    </div>
                    {f.observations ? (
                      <p className="text-sm text-ink mt-3"><strong>الملاحظات:</strong> {f.observations}</p>
                    ) : null}
                    {f.recommendations ? (
                      <p className="text-sm text-muted mt-1"><strong>التوصيات:</strong> {f.recommendations}</p>
                    ) : null}
                    {f.nextFollowUpDate ? (
                      <p className="text-xs text-muted mt-2 inline-flex items-center gap-1">
                        <CalendarCheck className="h-3 w-3" />
                        المتابعة القادمة: {formatDate(f.nextFollowUpDate)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">التقارير الطبية ({reports.length})</h3>
            {reports.length === 0 ? (
              <EmptyState title="لا توجد تقارير" />
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{r.reportType}</p>
                      <p className="text-xs text-muted">{formatDate(r.reportDate)} · {r.issuedBy ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">المستندات ({attachments.length})</h3>
            {attachments.length === 0 ? (
              <EmptyState title="لا توجد مستندات" description="ارفع مستندات من خلال الزر أعلاه." />
            ) : (
              <div className="space-y-2">
                {attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Paperclip className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={`/api/cases/${cs.id}/attachments/${a.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary hover:underline truncate block"
                      >
                        {a.fileName}
                      </a>
                      <p className="text-xs text-muted">
                        {(a.fileSize / 1024).toFixed(1)} ك.ب · {formatDate(a.createdAt)}
                      </p>
                    </div>
                    <AttachmentActions caseId={cs.id} attachmentId={a.id} canDelete={canDeleteDocuments(session.user.role)} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </CaseDetailClient>
  );
}

function MiniMetric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-background px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted">{icon}{label}</div>
      <p className="mt-1 text-base font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="text-ink text-sm text-end font-medium">{value}</dd>
    </div>
  );
}
