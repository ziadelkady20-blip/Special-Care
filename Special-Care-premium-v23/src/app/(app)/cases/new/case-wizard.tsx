"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  FormField,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  PageHeader,
  Alert,
} from "@/components/ui";
import { ChevronLeft, ChevronRight, Check, User, Users, Stethoscope, Briefcase, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { createCase } from "@/app/actions";
import { toast } from "sonner";

interface Props {
  specialists: { id: string; name: string }[];
  disabilities: { id: string; name: string }[];
  services: { id: string; name: string }[];
  userName: string;
  userId: string;
}

const schema = z.object({
  child: z.object({
    firstName: z.string().min(1, "مطلوب"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "مطلوب"),
    dateOfBirth: z.string().min(1, "مطلوب"),
    gender: z.enum(["MALE", "FEMALE"], { required_error: "مطلوب" }),
    nationalId: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
  }),
  family: z.object({
    fatherName: z.string().optional(),
    fatherPhone: z.string().optional(),
    motherName: z.string().optional(),
    motherPhone: z.string().optional(),
    maritalStatus: z.enum(["MARRIED", "DIVORCED", "SEPARATED", "WIDOWED", "SINGLE"]).optional(),
    familyMembersCount: z.coerce.number().int().min(0).optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  }),
  diagnoses: z
    .array(
      z.object({
        disabilityId: z.string().min(1, "اختر نوع الإعاقة"),
        diagnosisName: z.string().min(1, "مطلوب"),
        diagnosisDate: z.string().min(1, "مطلوب"),
        severity: z.enum(["MILD", "MODERATE", "SEVERE", "PROFOUND"]),
        diagnosedBy: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .min(1, "أضف تشخيصًا واحدًا على الأقل"),
  services: z.array(
    z.object({
      serviceId: z.string().min(1),
      startDate: z.string().min(1),
      endDate: z.string().optional(),
      specialistId: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  meta: z.object({
    assignedUserId: z.string().optional(),
    status: z.enum(["ACTIVE", "ON_HOLD", "CLOSED", "ARCHIVED"]),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
    registrationDate: z.string().min(1),
  }),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 0, title: "بيانات الطفل", icon: User },
  { id: 1, title: "بيانات الأسرة", icon: Users },
  { id: 2, title: "التشخيص", icon: Stethoscope },
  { id: 3, title: "الخدمات", icon: Briefcase },
  { id: 4, title: "مراجعة", icon: ClipboardCheck },
];

export function CaseWizard({ specialists, disabilities, services: serviceList, userName, userId }: Props) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      child: {
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "MALE",
      },
      family: {},
      diagnoses: [
        {
          disabilityId: "",
          diagnosisName: "",
          diagnosisDate: new Date().toISOString().slice(0, 10),
          severity: "MODERATE",
        },
      ],
      services: [],
      meta: {
        status: "ACTIVE",
        priority: "NORMAL",
        registrationDate: new Date().toISOString().slice(0, 10),
      },
    },
  });

  const stepFields: (keyof FormData)[][] = [
    ["child"],
    ["family"],
    ["diagnoses"],
    ["services"],
    ["meta"],
  ];

  const handleNext = async () => {
    const fields = stepFields[step].flatMap((k) => {
      if (k === "diagnoses") return form.getValues().diagnoses.map((_, i) => `diagnoses.${i}` as const);
      if (k === "services") return form.getValues().services.map((_, i) => `services.${i}` as const);
      return [k];
    }) as any;

    const ok = await form.trigger(fields);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    const res = await createCase(values);
    if (!res.ok) {
      setSubmitError(res.error ?? "حدث خطأ");
      return;
    }
    toast.success(`تم إنشاء الحالة ${res.caseNumber} بنجاح`);
    router.push(`/cases/${res.id}`);
  });

  const diagnoses = form.watch("diagnoses");
  const svc = form.watch("services");

  return (
    <>
      <PageHeader
        title="إضافة حالة جديدة"
        subtitle="أكمل الخطوات التالية لتسجيل حالة جديدة في المنصة."
      />

      {/* Stepper */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none">
          {STEPS.map((s, idx) => {
            const active = step === idx;
            const done = step > idx;
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => done && setStep(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : done
                        ? "text-success hover:bg-background"
                        : "text-muted"
                  }`}
                >
                  <span
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      active
                        ? "bg-primary text-white"
                        : done
                          ? "bg-success text-white"
                          : "bg-background border border-border"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : s.id + 1}
                  </span>
                  <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                </button>
                {idx < STEPS.length - 1 ? (
                  <div className={`flex-1 h-px mx-2 ${done ? "bg-success" : "bg-border"}`} />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(STEPS[step].icon, { className: "h-5 w-5 text-primary" })}
              {STEPS[step].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 0 && <ChildStep form={form} />}
            {step === 1 && <FamilyStep form={form} />}
            {step === 2 && <DiagnosesStep form={form} disabilities={disabilities} />}
            {step === 3 && <ServicesStep form={form} services={serviceList} specialists={specialists} />}
            {step === 4 && (
              <ReviewStep form={form} specialists={specialists} disabilities={disabilities} services={serviceList} />
            )}
          </CardContent>
          <CardFooter className="justify-between flex-row-reverse">
            <div className="flex gap-2">
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>
              ) : null}
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" loading={form.formState.isSubmitting}>
                  حفظ الحالة
                </Button>
              )}
            </div>
            <p className="text-xs text-muted hidden sm:block">
              خطوة {step + 1} من {STEPS.length}
            </p>
          </CardFooter>
        </Card>

        {submitError ? (
          <div className="mt-4">
            <Alert variant="error" title="تعذّر الحفظ">{submitError}</Alert>
          </div>
        ) : null}
      </form>
    </>
  );
}

// ============== Step Components ==============

function ChildStep({ form }: { form: any }) {
  const { register, formState } = form;
  const { errors } = formState;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="الاسم الأول" required error={errors.child?.firstName?.message}>
        <Input {...register("child.firstName")} />
      </FormField>
      <FormField label="الاسم الأوسط" error={errors.child?.middleName?.message}>
        <Input {...register("child.middleName")} />
      </FormField>
      <FormField label="اسم العائلة" required error={errors.child?.lastName?.message}>
        <Input {...register("child.lastName")} />
      </FormField>
      <FormField label="تاريخ الميلاد" required error={errors.child?.dateOfBirth?.message}>
        <Input type="date" {...register("child.dateOfBirth")} />
      </FormField>
      <FormField label="الجنس" required error={errors.child?.gender?.message}>
        <Controller
          name="child.gender"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">ذكر</SelectItem>
                <SelectItem value="FEMALE">أنثى</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <FormField label="الرقم الوطني" error={errors.child?.nationalId?.message}>
        <Input {...register("child.nationalId")} />
      </FormField>
      <FormField label="المدينة" error={errors.child?.city?.message}>
        <Input {...register("child.city")} />
      </FormField>
      <div className="md:col-span-2">
        <FormField label="العنوان" error={errors.child?.address?.message}>
          <Input {...register("child.address")} />
        </FormField>
      </div>
      <FormField label="رقم الجوال" error={errors.child?.phone?.message}>
        <Input {...register("child.phone")} />
      </FormField>
    </div>
  );
}

function FamilyStep({ form }: { form: any }) {
  const { register, formState, control } = form;
  const { errors } = formState;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="اسم الأب"><Input {...register("family.fatherName")} /></FormField>
      <FormField label="جوال الأب"><Input {...register("family.fatherPhone")} /></FormField>
      <FormField label="اسم الأم"><Input {...register("family.motherName")} /></FormField>
      <FormField label="جوال الأم"><Input {...register("family.motherPhone")} /></FormField>
      <FormField label="الحالة الاجتماعية">
        <Controller
          name="family.maritalStatus"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MARRIED">متزوّج</SelectItem>
                <SelectItem value="DIVORCED">مطلّق</SelectItem>
                <SelectItem value="SEPARATED">منفصل</SelectItem>
                <SelectItem value="WIDOWED">أرمل</SelectItem>
                <SelectItem value="SINGLE">أعزب</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <FormField label="عدد أفراد الأسرة">
        <Input type="number" {...register("family.familyMembersCount")} />
      </FormField>
      <div className="md:col-span-2">
        <FormField label="العنوان"><Input {...register("family.address")} /></FormField>
      </div>
      <div className="md:col-span-2">
        <FormField label="ملاحظات"><Textarea {...register("family.notes")} rows={3} /></FormField>
      </div>
    </div>
  );
}

function DiagnosesStep({ form, disabilities }: { form: any; disabilities: { id: string; name: string }[] }) {
  const { control, formState, register } = form;
  const diagnoses = form.watch("diagnoses") as any[];
  const errors = formState.errors;

  const addDiag = () => {
    const cur = form.getValues("diagnoses") ?? [];
    form.setValue(
      "diagnoses",
      [
        ...cur,
        {
          disabilityId: "",
          diagnosisName: "",
          diagnosisDate: new Date().toISOString().slice(0, 10),
          severity: "MODERATE",
        },
      ],
      { shouldValidate: true },
    );
  };
  const removeDiag = (idx: number) => {
    if (diagnoses.length <= 1) return;
    form.setValue(
      "diagnoses",
      diagnoses.filter((_, i) => i !== idx),
      { shouldValidate: true },
    );
  };

  return (
    <div className="space-y-4">
      {errors.diagnoses?.message ? (
        <Alert variant="warning">{String(errors.diagnoses.message)}</Alert>
      ) : null}

      {diagnoses.map((_, idx) => (
        <div key={idx} className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">تشخيص {idx + 1}</p>
            {diagnoses.length > 1 ? (
              <button
                type="button"
                onClick={() => removeDiag(idx)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-background"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="نوع الإعاقة" required error={errors.diagnoses?.[idx]?.disabilityId?.message}>
              <Controller
                name={`diagnoses.${idx}.disabilityId`}
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => {
                    field.onChange(v);
                    const dis = disabilities.find((d) => d.id === v);
                    if (dis) form.setValue(`diagnoses.${idx}.diagnosisName`, dis.name, { shouldValidate: true });
                  }}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {disabilities.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="اسم التشخيص" required error={errors.diagnoses?.[idx]?.diagnosisName?.message}>
              <Input {...register(`diagnoses.${idx}.diagnosisName`)} />
            </FormField>
            <FormField label="تاريخ التشخيص" required error={errors.diagnoses?.[idx]?.diagnosisDate?.message}>
              <Input type="date" {...register(`diagnoses.${idx}.diagnosisDate`)} />
            </FormField>
            <FormField label="الشدة" required>
              <Controller
                name={`diagnoses.${idx}.severity`}
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MILD">خفيف</SelectItem>
                      <SelectItem value="MODERATE">متوسط</SelectItem>
                      <SelectItem value="SEVERE">شديد</SelectItem>
                      <SelectItem value="PROFOUND">عميق</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="شخّص بواسطة"><Input {...register(`diagnoses.${idx}.diagnosedBy`)} /></FormField>
            <FormField label="ملاحظات"><Input {...register(`diagnoses.${idx}.notes`)} /></FormField>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addDiag}>
        <Plus className="h-4 w-4" />
        إضافة تشخيص آخر
      </Button>
    </div>
  );
}

function ServicesStep({
  form,
  services,
  specialists,
}: {
  form: any;
  services: { id: string; name: string }[];
  specialists: { id: string; name: string }[];
}) {
  const { control, register } = form;
  const svc = form.watch("services") as any[];
  const add = () => {
    const cur = form.getValues("services") ?? [];
    form.setValue("services", [...cur, { serviceId: services[0]?.id ?? "", startDate: new Date().toISOString().slice(0, 10) }], { shouldValidate: true });
  };
  const remove = (idx: number) => {
    form.setValue("services", svc.filter((_, i) => i !== idx), { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">أضف الخدمات الحالية التي يحصل عليها الطفل.</p>
      {svc.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Briefcase className="h-8 w-8 text-muted mx-auto" />
          <p className="mt-2 text-sm text-muted">لم تتم إضافة خدمات بعد</p>
        </div>
      ) : (
        svc.map((_, idx) => (
          <div key={idx} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink">خدمة {idx + 1}</p>
              <button type="button" onClick={() => remove(idx)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-background">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="الخدمة">
                <Controller
                  name={`services.${idx}.serviceId`}
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="الأخصائي المسؤول">
                <Controller
                  name={`services.${idx}.specialistId`}
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        {specialists.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="تاريخ البدء"><Input type="date" {...register(`services.${idx}.startDate`)} /></FormField>
              <FormField label="تاريخ الانتهاء (اختياري)"><Input type="date" {...register(`services.${idx}.endDate`)} /></FormField>
              <div className="md:col-span-2">
                <FormField label="ملاحظات"><Input {...register(`services.${idx}.notes`)} /></FormField>
              </div>
            </div>
          </div>
        ))
      )}
      <Button type="button" variant="outline" onClick={add}>
        <Plus className="h-4 w-4" />
        إضافة خدمة
      </Button>
    </div>
  );
}

function ReviewStep({
  form,
  specialists,
  disabilities,
  services,
}: {
  form: any;
  specialists: { id: string; name: string }[];
  disabilities: { id: string; name: string }[];
  services: { id: string; name: string }[];
}) {
  const { control, register } = form;
  const values = form.watch() as FormData;

  const childFullName = `${values.child.firstName} ${values.child.middleName ?? ""} ${values.child.lastName}`.trim();
  const specName = (id: string | undefined) => specialists.find((s) => s.id === id)?.name ?? "—";
  const disName = (id: string) => disabilities.find((d) => d.id === id)?.name ?? "—";
  const srvName = (id: string) => services.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="الحالة">
          <Controller
            name="meta.status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">نشط</SelectItem>
                  <SelectItem value="ON_HOLD">معلّق</SelectItem>
                  <SelectItem value="CLOSED">مغلق</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="الأولوية">
          <Controller
            name="meta.priority"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">منخفضة</SelectItem>
                  <SelectItem value="NORMAL">عادية</SelectItem>
                  <SelectItem value="HIGH">مرتفعة</SelectItem>
                  <SelectItem value="URGENT">طارئة</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="الأخصائي المسؤول">
          <Controller
            name="meta.assignedUserId"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="اختر (اختياري)" /></SelectTrigger>
                <SelectContent>
                  {specialists.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="تاريخ التسجيل">
          <Input type="date" {...register("meta.registrationDate")} />
        </FormField>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <h4 className="text-sm font-semibold text-ink">ملخص البيانات</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted text-xs">الطفل</p>
            <p className="font-medium text-ink">{childFullName}</p>
          </div>
          <div>
            <p className="text-muted text-xs">تاريخ الميلاد</p>
            <p className="font-medium text-ink tabular-nums">{values.child.dateOfBirth}</p>
          </div>
          <div>
            <p className="text-muted text-xs">التشخيصات ({values.diagnoses.length})</p>
            <ul className="list-disc list-inside text-ink text-xs">
              {values.diagnoses.map((d, i) => (
                <li key={i}>{d.diagnosisName} — {disName(d.disabilityId)}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-muted text-xs">الخدمات ({values.services.length})</p>
            <ul className="list-disc list-inside text-ink text-xs">
              {values.services.map((s, i) => (
                <li key={i}>{srvName(s.serviceId)} — {specName(s.specialistId)}</li>
              ))}
              {values.services.length === 0 ? <li className="text-muted">—</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
