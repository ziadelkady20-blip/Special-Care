"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  FormField,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  FileUploader,
} from "@/components/ui";
import { Plus, Upload, FileText, Pencil, Trash2 } from "lucide-react";
import { createFollowUp, addNote, createMedicalReport, updateCaseStatus, updateCase, updateCaseServiceStatus } from "@/app/actions";
import { canAddFollowUps, canEditCases, canUploadDocuments, canChangeCaseStatus, type AppRole } from "@/lib/permissions";

export function CaseDetailClient({
  caseData,
  ref,
  sessionUser,
  children,
}: {
  caseData: any;
  ref: any;
  sessionUser: { id: string; role: AppRole };
  children: React.ReactNode;
}) {
  const [followUpOpen, setFollowUpOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);

  const canFollowUp = canAddFollowUps(sessionUser.role);
  const canEdit = canEditCases(sessionUser.role);
  const canStatus = canChangeCaseStatus(sessionUser.role);
  const canUpload = canUploadDocuments(sessionUser.role);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2 justify-end">
        {canEdit ? (
          <EditCaseDialog
            caseData={caseData}
            specialists={ref.specialists}
            disabilities={ref.disabilities}
            services={ref.services}
          />
        ) : null}
        {canStatus ? (
          <StatusChanger caseId={caseData.case.id} currentStatus={caseData.case.status} />
        ) : null}
        {canFollowUp ? (
          <Button size="sm" onClick={() => setFollowUpOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة متابعة
          </Button>
        ) : null}
        {canEdit ? (
          <Button size="sm" variant="outline" onClick={() => setReportOpen(true)}>
            <FileText className="h-4 w-4" />
            تقرير طبي
          </Button>
        ) : null}
        {canUpload ? (
          <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            رفع مستند
          </Button>
        ) : null}
      </div>

      {children}

      {canFollowUp ? (
        <FollowUpDialog
          open={followUpOpen}
          onClose={() => setFollowUpOpen(false)}
          caseId={caseData.case.id}
          specialists={ref.specialists}
          services={caseData.services ?? []}
        />
      ) : null}
      {canEdit ? (
        <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} caseId={caseData.case.id} />
      ) : null}
      {canUpload ? (
        <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} caseId={caseData.case.id} />
      ) : null}
    </>
  );
}

function EditCaseDialog({
  caseData,
  specialists,
  disabilities,
  services,
}: {
  caseData: any;
  specialists: { id: string; name: string }[];
  disabilities: { id: string; name: string }[];
  services: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<any>({
    resolver: zodResolver(z.object({
      child: z.object({
        firstName: z.string().min(1, "مطلوب"),
        middleName: z.string().optional(),
        lastName: z.string().min(1, "مطلوب"),
        dateOfBirth: z.string().min(1, "مطلوب"),
        gender: z.enum(["MALE", "FEMALE"]),
        nationalId: z.string().optional(),
        city: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
      }),
      family: z.object({
        fatherName: z.string().optional(), fatherPhone: z.string().optional(),
        motherName: z.string().optional(), motherPhone: z.string().optional(),
        maritalStatus: z.enum(["MARRIED", "DIVORCED", "SEPARATED", "WIDOWED", "SINGLE"]).optional(),
        familyMembersCount: z.coerce.number().int().min(0).optional(),
        address: z.string().optional(), notes: z.string().optional(),
      }),
      diagnoses: z.array(z.object({
        disabilityId: z.string().uuid("اختر نوع الإعاقة"),
        diagnosisName: z.string().min(1, "مطلوب"),
        diagnosisDate: z.string().min(1, "مطلوب"),
        severity: z.enum(["MILD", "MODERATE", "SEVERE", "PROFOUND"]),
        diagnosedBy: z.string().optional(), notes: z.string().optional(),
      })).min(1),
      services: z.array(z.object({
        id: z.string().uuid().optional(),
        serviceId: z.string().uuid("اختر الخدمة"),
        startDate: z.string().min(1),
        endDate: z.string().optional(),
        specialistId: z.string().uuid().optional(),
        status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]).default("ACTIVE"),
        notes: z.string().optional(),
      })),
      meta: z.object({
        assignedUserId: z.string().uuid().optional(),
        status: z.enum(["ACTIVE", "ON_HOLD", "CLOSED", "ARCHIVED"]),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
        registrationDate: z.string().min(1),
      }),
    })),
    defaultValues: buildEditDefaults(caseData),
  });

  React.useEffect(() => {
    if (open) form.reset(buildEditDefaults(caseData));
  }, [open, caseData, form]);

  const diagnoses = form.watch("diagnoses") ?? [];
  const caseServices = form.watch("services") ?? [];
  const submit = form.handleSubmit(async (values) => {
    const result = await updateCase({ caseId: caseData.case.id, ...values });
    if (result.ok) {
      toast.success("تم تحديث بيانات الحالة");
      setOpen(false);
      form.reset(values);
    } else {
      toast.error(result.error ?? "تعذّر تحديث الحالة");
    }
  });

  const addDiagnosis = () => {
    form.setValue("diagnoses", [
      ...diagnoses,
      {
        disabilityId: "",
        diagnosisName: "",
        diagnosisDate: new Date().toISOString().slice(0, 10),
        severity: "MODERATE",
        diagnosedBy: "",
        notes: "",
      },
    ], { shouldValidate: true });
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        تعديل البيانات
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تعديل بيانات الحالة</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <section className="space-y-3">
              <h3 className="font-semibold text-ink">بيانات الطفل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="الاسم الأول" required><Input {...form.register("child.firstName")} /></FormField>
                <FormField label="الاسم الأوسط"><Input {...form.register("child.middleName")} /></FormField>
                <FormField label="اسم العائلة" required><Input {...form.register("child.lastName")} /></FormField>
                <FormField label="تاريخ الميلاد" required><Input type="date" {...form.register("child.dateOfBirth")} /></FormField>
                <FormField label="الجنس" required>
                  <Controller name="child.gender" control={form.control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MALE">ذكر</SelectItem><SelectItem value="FEMALE">أنثى</SelectItem></SelectContent></Select>
                  )} />
                </FormField>
                <FormField label="الرقم الوطني"><Input {...form.register("child.nationalId")} /></FormField>
                <FormField label="المدينة"><Input {...form.register("child.city")} /></FormField>
                <FormField label="الجوال"><Input {...form.register("child.phone")} /></FormField>
                <div className="md:col-span-2"><FormField label="العنوان"><Input {...form.register("child.address")} /></FormField></div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-ink">بيانات الأسرة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="اسم الأب"><Input {...form.register("family.fatherName")} /></FormField>
                <FormField label="جوال الأب"><Input {...form.register("family.fatherPhone")} /></FormField>
                <FormField label="اسم الأم"><Input {...form.register("family.motherName")} /></FormField>
                <FormField label="جوال الأم"><Input {...form.register("family.motherPhone")} /></FormField>
                <FormField label="الحالة الاجتماعية">
                  <Controller name="family.maritalStatus" control={form.control} render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>
                      <SelectItem value="MARRIED">متزوج</SelectItem><SelectItem value="DIVORCED">مطلق</SelectItem><SelectItem value="SEPARATED">منفصل</SelectItem><SelectItem value="WIDOWED">أرمل</SelectItem><SelectItem value="SINGLE">أعزب</SelectItem>
                    </SelectContent></Select>
                  )} />
                </FormField>
                <FormField label="عدد أفراد الأسرة"><Input type="number" {...form.register("family.familyMembersCount")} /></FormField>
                <div className="md:col-span-2"><FormField label="العنوان"><Input {...form.register("family.address")} /></FormField></div>
                <div className="md:col-span-2"><FormField label="ملاحظات"><Textarea rows={2} {...form.register("family.notes")} /></FormField></div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-ink">التشخيصات</h3><Button type="button" size="sm" variant="outline" onClick={addDiagnosis}><Plus className="h-4 w-4" /> إضافة تشخيص</Button></div>
              {diagnoses.map((_: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-border p-3 space-y-3">
                  <div className="flex justify-between items-center"><span className="text-sm font-medium">تشخيص {idx + 1}</span>{diagnoses.length > 1 ? <button type="button" onClick={() => form.setValue("diagnoses", diagnoses.filter((_: any, i: number) => i !== idx), { shouldValidate: true })} className="text-danger"><Trash2 className="h-4 w-4" /></button> : null}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField label="نوع الإعاقة" required>
                      <Controller name={`diagnoses.${idx}.disabilityId`} control={form.control} render={({ field }) => <Select value={field.value} onValueChange={(v) => { field.onChange(v); const dis = disabilities.find((d) => d.id === v); if (dis) form.setValue(`diagnoses.${idx}.diagnosisName`, dis.name); }}><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{disabilities.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>} />
                    </FormField>
                    <FormField label="التشخيص"><Input {...form.register(`diagnoses.${idx}.diagnosisName`)} /></FormField>
                    <FormField label="تاريخ التشخيص"><Input type="date" {...form.register(`diagnoses.${idx}.diagnosisDate`)} /></FormField>
                    <FormField label="المستوى">
                      <Controller name={`diagnoses.${idx}.severity`} control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MILD">بسيط</SelectItem><SelectItem value="MODERATE">متوسط</SelectItem><SelectItem value="SEVERE">شديد</SelectItem><SelectItem value="PROFOUND">شديد جدًا</SelectItem></SelectContent></Select>} />
                    </FormField>
                    <FormField label="جهة التشخيص"><Input {...form.register(`diagnoses.${idx}.diagnosedBy`)} /></FormField>
                    <FormField label="ملاحظات"><Input {...form.register(`diagnoses.${idx}.notes`)} /></FormField>
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-ink">الخدمات الحالية</h3><Button type="button" size="sm" variant="outline" onClick={() => form.setValue("services", [...caseServices, { id: undefined, serviceId: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", specialistId: undefined, status: "ACTIVE", notes: "" }], { shouldValidate: true })}><Plus className="h-4 w-4" /> إضافة خدمة</Button></div>
              {caseServices.length === 0 ? <p className="text-xs text-muted">لا توجد خدمات مرتبطة بهذه الحالة.</p> : null}
              {caseServices.map((_: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">خدمة {idx + 1}</span><button type="button" className="text-danger" onClick={() => form.setValue("services", caseServices.filter((_: any, i: number) => i !== idx), { shouldValidate: true })}><Trash2 className="h-4 w-4" /></button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField label="الخدمة" required><Controller name={`services.${idx}.serviceId`} control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="اختر الخدمة" /></SelectTrigger><SelectContent>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>} /></FormField>
                    <FormField label="الأخصائي"><Controller name={`services.${idx}.specialistId`} control={form.control} render={({ field }) => <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}><SelectTrigger><SelectValue placeholder="غير معيّن" /></SelectTrigger><SelectContent><SelectItem value="none">غير معيّن</SelectItem>{specialists.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>} /></FormField>
                    <FormField label="حالة الخدمة"><Controller name={`services.${idx}.status`} control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">نشطة</SelectItem><SelectItem value="PAUSED">موقوفة مؤقتًا</SelectItem><SelectItem value="COMPLETED">مكتملة</SelectItem><SelectItem value="CANCELLED">ملغاة</SelectItem></SelectContent></Select>} /></FormField>
                    <FormField label="تاريخ البداية"><Input type="date" {...form.register(`services.${idx}.startDate`)} /></FormField>
                    <FormField label="تاريخ الانتهاء"><Input type="date" {...form.register(`services.${idx}.endDate`)} /></FormField>
                    <div className="md:col-span-2"><FormField label="ملاحظات"><Input {...form.register(`services.${idx}.notes`)} /></FormField></div>
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-ink">إعدادات الحالة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="الأخصائي المسؤول">
                  <Controller name="meta.assignedUserId" control={form.control} render={({ field }) => <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}><SelectTrigger><SelectValue placeholder="غير معيّن" /></SelectTrigger><SelectContent><SelectItem value="none">غير معيّن</SelectItem>{specialists.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>} />
                </FormField>
                <FormField label="الأولوية"><Controller name="meta.priority" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">منخفضة</SelectItem><SelectItem value="NORMAL">عادية</SelectItem><SelectItem value="HIGH">عالية</SelectItem><SelectItem value="URGENT">عاجلة</SelectItem></SelectContent></Select>} /></FormField>
                <FormField label="حالة الملف"><Controller name="meta.status" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">نشطة</SelectItem><SelectItem value="ON_HOLD">معلّقة</SelectItem><SelectItem value="CLOSED">مغلقة</SelectItem><SelectItem value="ARCHIVED">مؤرشفة</SelectItem></SelectContent></Select>} /></FormField>
                <FormField label="تاريخ التسجيل"><Input type="date" {...form.register("meta.registrationDate")} /></FormField>
              </div>
            </section>

            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button type="submit" loading={form.formState.isSubmitting}>حفظ التعديلات</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function buildEditDefaults(caseData: any) {
  return {
    child: {
      firstName: caseData.child.firstName ?? "",
      middleName: caseData.child.middleName ?? "",
      lastName: caseData.child.lastName ?? "",
      dateOfBirth: caseData.child.dateOfBirth ?? "",
      gender: caseData.child.gender ?? "MALE",
      nationalId: caseData.child.nationalId ?? "",
      city: caseData.child.city ?? "",
      address: caseData.child.address ?? "",
      phone: caseData.child.phone ?? "",
    },
    family: {
      fatherName: caseData.family?.fatherName ?? "",
      fatherPhone: caseData.family?.fatherPhone ?? "",
      motherName: caseData.family?.motherName ?? "",
      motherPhone: caseData.family?.motherPhone ?? "",
      maritalStatus: caseData.family?.maritalStatus ?? undefined,
      familyMembersCount: caseData.family?.familyMembersCount ?? undefined,
      address: caseData.family?.address ?? "",
      notes: caseData.family?.notes ?? "",
    },
    diagnoses: caseData.diagnoses.map((d: any) => ({
      disabilityId: d.disabilityId,
      diagnosisName: d.diagnosisName,
      diagnosisDate: d.diagnosisDate,
      severity: d.severity,
      diagnosedBy: d.diagnosedBy ?? "",
      notes: d.notes ?? "",
    })),
    services: caseData.services.map((s: any) => ({
      id: s.id ?? undefined,
      serviceId: s.serviceId ?? "",
      startDate: s.startDate ?? new Date().toISOString().slice(0, 10),
      endDate: s.endDate ?? "",
      specialistId: s.specialistId ?? undefined,
      status: s.status ?? "ACTIVE",
      notes: s.notes ?? "",
    })),
    meta: {
      assignedUserId: caseData.case.assignedUserId ?? undefined,
      status: caseData.case.status,
      priority: caseData.case.priority,
      registrationDate: caseData.case.registrationDate,
    },
  };
}

function StatusChanger({ caseId, currentStatus }: { caseId: string; currentStatus: string }) {
  const [status, setStatus] = React.useState(currentStatus);
  const [loading, setLoading] = React.useState(false);

  const handleChange = async (v: string) => {
    setLoading(true);
    const res = await updateCaseStatus(caseId, v as any);
    setLoading(false);
    if (res.ok) {
      setStatus(v);
      toast.success("تم تحديث حالة الحالة");
    } else {
      toast.error("تعذّر التحديث");
    }
  };

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="h-9 w-36 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">نشط</SelectItem>
        <SelectItem value="ON_HOLD">معلّق</SelectItem>
        <SelectItem value="CLOSED">مغلق</SelectItem>
        <SelectItem value="ARCHIVED">مؤرشف</SelectItem>
      </SelectContent>
    </Select>
  );
}

const followUpSchema = z.object({
  caseServiceId: z.string().uuid().optional(),
  followUpDate: z.string().min(1),
  progress: z.enum(["IMPROVING", "STABLE", "DECLINING", "NEEDS_REVIEW"]),
  observations: z.string().min(3, "الملاحظات قصيرة جدًا"),
  recommendations: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
});
type FollowUpForm = z.infer<typeof followUpSchema>;

function FollowUpDialog({
  open,
  onClose,
  caseId,
  specialists,
  services,
}: {
  open: boolean;
  onClose: () => void;
  caseId: string;
  specialists: { id: string; name: string }[];
  services: { id: string; serviceId: string; serviceName: string; status: string }[];
}) {
  const form = useForm<FollowUpForm>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      caseServiceId: undefined,
      followUpDate: new Date().toISOString().slice(0, 10),
      progress: "STABLE",
      observations: "",
      recommendations: "",
      nextFollowUpDate: "",
    },
  });

  const onSubmit = form.handleSubmit(async (v) => {
    const res = await createFollowUp({ caseId, ...v });
    if (res.ok) {
      toast.success("تمت إضافة المتابعة");
      form.reset();
      onClose();
    } else {
      toast.error(res.error ?? "تعذّر الحفظ");
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة متابعة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <FormField label="الخدمة المرتبطة">
            <Controller name="caseServiceId" control={form.control} render={({ field }) => (
              <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="اختر الخدمة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">متابعة عامة</SelectItem>
                  {services.filter((s) => s.status === "ACTIVE").map((s) => <SelectItem key={s.id} value={s.id}>{s.serviceName}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </FormField>
          <FormField label="تاريخ المتابعة" required error={form.formState.errors.followUpDate?.message}>
            <Input type="date" {...form.register("followUpDate")} />
          </FormField>
          <FormField label="التقييم" required>
            <Controller
              name="progress"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMPROVING">يتحسّن</SelectItem>
                    <SelectItem value="STABLE">مستقر</SelectItem>
                    <SelectItem value="DECLINING">يتراجع</SelectItem>
                    <SelectItem value="NEEDS_REVIEW">يحتاج مراجعة</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="الملاحظات" required error={form.formState.errors.observations?.message}>
            <Textarea rows={3} {...form.register("observations")} />
          </FormField>
          <FormField label="التوصيات">
            <Textarea rows={2} {...form.register("recommendations")} />
          </FormField>
          <FormField label="تاريخ المتابعة القادمة">
            <Input type="date" {...form.register("nextFollowUpDate")} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" loading={form.formState.isSubmitting}>حفظ</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReportDialog({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const [loading, setLoading] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(formRef.current!);
    const res = await createMedicalReport(caseId, fd);
    setLoading(false);
    if (res.ok) {
      toast.success("تم حفظ التقرير");
      formRef.current?.reset();
      onClose();
    } else {
      toast.error("تعذّر الحفظ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة تقرير طبي</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} className="space-y-3">
          <FormField label="نوع التقرير" required>
            <Input name="reportType" defaultValue="تقرير طبي" />
          </FormField>
          <FormField label="تاريخ التقرير" required>
            <Input type="date" name="reportDate" defaultValue={new Date().toISOString().slice(0, 10)} />
          </FormField>
          <FormField label="جهة الإصدار">
            <Input name="issuedBy" placeholder="مستشفى / عيادة" />
          </FormField>
          <FormField label="الوصف">
            <Textarea name="description" rows={3} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" loading={loading}>حفظ</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const [loading, setLoading] = React.useState(false);

  const handleFiles = async (files: File[]) => {
    setLoading(true);
    let ok = 0;
    for (const file of files) {
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
        const pathname = `cases/${caseId}/${crypto.randomUUID()}-${safeName}`;
        const blob = await upload(pathname, file, {
          access: "private",
          handleUploadUrl: "/api/uploads/handle",
          clientPayload: JSON.stringify({
            caseId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          }),
        });
        if (!blob.pathname.startsWith(`cases/${caseId}/`)) throw new Error("مسار الملف غير صالح");
        ok++;
      } catch (error) {
        console.error(error);
      }
    }
    setLoading(false);
    toast.success(`تم رفع ${ok} من ${files.length} ملف`);
    if (ok > 0) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>رفع مستند</DialogTitle>
        </DialogHeader>
        <FileUploader onFiles={handleFiles} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function AttachmentActions({ caseId, attachmentId, canDelete }: { caseId: string; attachmentId: string; canDelete: boolean }) {
  const [loading, setLoading] = React.useState(false);
  if (!canDelete) return null;
  const remove = async () => {
    if (!window.confirm("هل تريد حذف هذا المستند نهائيًا؟")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/attachments/${attachmentId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "تعذر الحذف");
      toast.success("تم حذف المستند");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر الحذف");
      setLoading(false);
    }
  };
  return <Button type="button" size="sm" variant="ghost" onClick={remove} disabled={loading} className="text-danger">{loading ? "..." : <Trash2 className="h-4 w-4" />}</Button>;
}


export function ServiceLifecycleControl({ serviceId, currentStatus }: { serviceId: string; currentStatus: string }) {
  const [status, setStatus] = React.useState(currentStatus);
  const [loading, setLoading] = React.useState(false);
  const change = async (next: string) => {
    setLoading(true);
    try {
      const res = await updateCaseServiceStatus(serviceId, next as any);
      if (res.ok) { setStatus(next); toast.success("تم تحديث حالة الخدمة"); }
      else toast.error(res.error ?? "تعذر تحديث الخدمة");
    } catch (e: any) { toast.error(e?.message ?? "تعذر تحديث الخدمة"); }
    finally { setLoading(false); }
  };
  return (
    <Select value={status} onValueChange={change} disabled={loading}>
      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">نشطة</SelectItem>
        <SelectItem value="PAUSED">موقوفة</SelectItem>
        <SelectItem value="COMPLETED">مكتملة</SelectItem>
        <SelectItem value="CANCELLED">ملغاة</SelectItem>
      </SelectContent>
    </Select>
  );
}
