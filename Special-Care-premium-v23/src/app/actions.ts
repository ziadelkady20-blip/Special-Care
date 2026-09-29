"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { compare } from "bcryptjs";
import { and, asc, eq, sql } from "drizzle-orm";
import { canEditCases, canCreateCases, canChangeCaseStatus, canAddFollowUps, canCreateUsers, canEditUsers, canManageCenters } from "@/lib/auth";
import { db } from "@/db";
import {
  children,
  cases,
  families,
  diagnoses,
  caseServices,
  followUps,
  notes,
  users,
  roles,
  notifications,
  medicalReports,
  attachments,
  services,
  parents,
  parentChildren,
  childCenters,
  childProfiles,
  disabilities,
  centers,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { getCurrentAppUser } from "@/lib/session";
import { canUploadDocuments } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/queries";

async function getSessionOrThrow() {
  const user = await getCurrentAppUser();
  if (!user) throw new Error("الجلسة غير صالحة أو تم تعطيل الحساب");
  return user;
}

// ============ Create Case ============
const childSchema = z.object({
  firstName: z.string().min(1, "مطلوب"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "مطلوب"),
  dateOfBirth: z.string().min(1, "مطلوب"),
  gender: z.enum(["MALE", "FEMALE"]),
  nationalId: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.dateOfBirth > new Date().toISOString().slice(0, 10)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateOfBirth"], message: "تاريخ الميلاد لا يمكن أن يكون في المستقبل" });
  }
});
const familySchema = z.object({
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  maritalStatus: z.enum(["MARRIED", "DIVORCED", "SEPARATED", "WIDOWED", "SINGLE"]).optional(),
  familyMembersCount: z.coerce.number().int().min(0).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
const diagnosisSchema = z.object({
  disabilityId: z.string().uuid(),
  diagnosisName: z.string().min(1, "مطلوب"),
  diagnosisDate: z.string().min(1, "مطلوب"),
  severity: z.enum(["MILD", "MODERATE", "SEVERE", "PROFOUND"]),
  diagnosedBy: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.diagnosisDate > new Date().toISOString().slice(0, 10)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["diagnosisDate"], message: "تاريخ التشخيص لا يمكن أن يكون في المستقبل" });
  }
});
const serviceEntrySchema = z.object({
  id: z.string().uuid().optional(),
  serviceId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  specialistId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]).default("ACTIVE"),
  notes: z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.endDate && v.endDate < v.startDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية" });
  }
  if (v.status === "COMPLETED" && v.startDate > new Date().toISOString().slice(0, 10)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["status"], message: "لا يمكن إكمال خدمة لم تبدأ بعد" });
  }
});
const caseMetaSchema = z.object({
  assignedUserId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "CLOSED", "ARCHIVED"]).default("ACTIVE"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  registrationDate: z.string().min(1),
}).superRefine((v, ctx) => {
  if (v.registrationDate > new Date().toISOString().slice(0, 10)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["registrationDate"], message: "تاريخ التسجيل لا يمكن أن يكون في المستقبل" });
  }
});
const wizardSchema = z.object({
  child: childSchema,
  family: familySchema,
  diagnoses: z.array(diagnosisSchema).min(1, "أضف تشخيصًا واحدًا على الأقل"),
  services: z.array(serviceEntrySchema),
  meta: caseMetaSchema,
}).superRefine((v, ctx) => validateCaseTimeline(v, ctx));

function validateCaseTimeline(v: z.infer<typeof wizardSchema>, ctx: z.RefinementCtx) {
  if (v.child.dateOfBirth > v.meta.registrationDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["meta", "registrationDate"], message: "تاريخ تسجيل الحالة لا يمكن أن يسبق تاريخ ميلاد الطفل" });
  }
  for (const [index, diagnosis] of v.diagnoses.entries()) {
    if (diagnosis.diagnosisDate < v.child.dateOfBirth) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["diagnoses", index, "diagnosisDate"], message: "تاريخ التشخيص لا يمكن أن يسبق تاريخ ميلاد الطفل" });
    }
  }
  for (const [index, service] of v.services.entries()) {
    if (service.startDate < v.meta.registrationDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["services", index, "startDate"], message: "تاريخ بداية الخدمة لا يمكن أن يسبق تاريخ تسجيل الحالة" });
    }
  }
}

export async function createCase(formData: unknown) {
  const user = await getSessionOrThrow();
  if (!canCreateCases(user.role)) throw new Error("لا تملك صلاحية إنشاء الحالات");

  const parsed = wizardSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "البيانات غير صالحة", details: parsed.error.flatten() };
  }
  const data = parsed.data;
  if (!canChangeCaseStatus(user.role) && data.meta.status !== "ACTIVE") {
    return { ok: false, error: "لا تملك صلاحية تغيير حالة الملف أثناء الإنشاء" };
  }

  const year = new Date().getFullYear();

  try {
    const result = await db.transaction(async (tx) => {
      // Serialize case-number allocation per year to avoid duplicates under concurrent requests.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`special-care-case-number-${year}`}))`);
      const seqRes = await tx.execute(sql`
        SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 10) AS INTEGER)), 0) + 1 AS seq
        FROM cases WHERE case_number LIKE ${`SC-${year}-%`}
      `);
      const seqRows = Array.isArray(seqRes) ? seqRes : (seqRes as any)?.rows ?? [];
      const seq = Number(seqRows[0]?.seq ?? 1);
      const caseNumber = `SC-${year}-${String(seq).padStart(6, "0")}`;

      if (data.meta.assignedUserId) {
        const [assigned] = await tx
          .select({ id: users.id })
          .from(users)
          .innerJoin(roles, eq(users.roleId, roles.id))
          .where(and(eq(users.id, data.meta.assignedUserId), eq(users.centerId, user.centerId), eq(users.status, "ACTIVE"), eq(roles.name, "SPECIALIST")))
          .limit(1);
        if (!assigned) throw new Error("الأخصائي/المستخدم المحدد غير تابع للمركز");
      }
      const [child] = await tx
        .insert(children)
        .values({
          firstName: data.child.firstName,
          middleName: data.child.middleName ?? null,
          lastName: data.child.lastName,
          dateOfBirth: data.child.dateOfBirth,
          gender: data.child.gender,
          nationalId: data.child.nationalId ?? null,
          city: data.child.city ?? null,
          address: data.child.address ?? null,
          phone: data.child.phone ?? null,
        })
        .returning();

      const [c] = await tx
        .insert(cases)
        .values({
          caseNumber,
          centerId: user.centerId,
          childId: child.id,
          assignedUserId: data.meta.assignedUserId || null,
          status: data.meta.status,
          priority: data.meta.priority,
          registrationDate: data.meta.registrationDate,
          createdBy: user.id,
        })
        .returning();

      await tx.insert(childCenters).values({
        childId: child.id,
        centerId: user.centerId,
        status: "ACTIVE",
      }).onConflictDoUpdate({
        target: [childCenters.childId, childCenters.centerId],
        set: { status: "ACTIVE", endedAt: null },
      });

      await tx.insert(families).values({
        caseId: c.id,
        fatherName: data.family.fatherName ?? null,
        fatherPhone: data.family.fatherPhone ?? null,
        motherName: data.family.motherName ?? null,
        motherPhone: data.family.motherPhone ?? null,
        maritalStatus: data.family.maritalStatus ?? null,
        familyMembersCount: data.family.familyMembersCount ?? null,
        address: data.family.address ?? null,
        notes: data.family.notes ?? null,
      });

      for (const d of data.diagnoses) {
        await tx.insert(diagnoses).values({
          caseId: c.id,
          disabilityId: d.disabilityId,
          diagnosisName: d.diagnosisName,
          diagnosisDate: d.diagnosisDate,
          severity: d.severity,
          diagnosedBy: d.diagnosedBy ?? null,
          notes: d.notes ?? null,
        });
      }

      for (const s of data.services) {
        const [service] = await tx
          .select({ id: services.id })
          .from(services)
          .where(and(eq(services.id, s.serviceId), eq(services.status, "ACTIVE")))
          .limit(1);
        if (!service) throw new Error("الخدمة المحددة غير متاحة");
        if (s.specialistId) {
          const [specialist] = await tx
            .select({ id: users.id })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(and(eq(users.id, s.specialistId), eq(users.centerId, user.centerId), eq(users.status, "ACTIVE"), eq(roles.name, "SPECIALIST")))
            .limit(1);
          if (!specialist) throw new Error("الأخصائي المحدد للخدمة غير تابع للمركز");
        }
        await tx.insert(caseServices).values({
          caseId: c.id,
          serviceId: s.serviceId,
          startDate: s.startDate,
          endDate: s.endDate ?? null,
          status: s.status,
          specialistId: s.specialistId ?? null,
          notes: s.notes ?? null,
        });
      }

      return { ...c, caseNumber };
    });

    await writeAuditLog({
      centerId: user.centerId,
      userId: user.id,
      action: "CREATE_CASE",
      entityType: "case",
      entityId: result.id,
      newValues: { caseNumber: result.caseNumber },
    });

    revalidatePath("/cases");
    revalidatePath("/dashboard");
    return { ok: true, id: result.id, caseNumber: result.caseNumber };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "حدث خطأ أثناء الإنشاء" };
  }
}

// ============ Update Case ============
const updateCaseSchema = z.object({
  caseId: z.string().uuid(),
  child: childSchema,
  family: familySchema,
  diagnoses: z.array(diagnosisSchema).min(1, "أضف تشخيصًا واحدًا على الأقل"),
  services: z.array(serviceEntrySchema),
  meta: caseMetaSchema,
}).superRefine((v, ctx) => validateCaseTimeline(v, ctx));

export async function updateCase(formData: unknown) {
  const user = await getSessionOrThrow();
  if (!canEditCases(user.role)) throw new Error("لا تملك صلاحية");

  const parsed = updateCaseSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: "البيانات غير صالحة", details: parsed.error.flatten() };
  const data = parsed.data;

  const [current] = await db
    .select({
      id: cases.id,
      centerId: cases.centerId,
      childId: cases.childId,
      status: cases.status,
      priority: cases.priority,
      assignedUserId: cases.assignedUserId,
    })
    .from(cases)
    .where(and(eq(cases.id, data.caseId), eq(cases.centerId, user.centerId)))
    .limit(1);

  if (!current) return { ok: false, error: "الحالة غير موجودة" };

  const [membership] = await db.select({ id: childCenters.id }).from(childCenters)
    .where(and(eq(childCenters.childId, current.childId), eq(childCenters.centerId, user.centerId), eq(childCenters.status, "ACTIVE"))).limit(1);
  if (!membership && user.role !== "SUPER_ADMIN") return { ok: false, error: "الطفل غير مرتبط حاليًا بهذا المركز" };

  if (!canChangeCaseStatus(user.role)) {
    // Editing a case must never implicitly reopen/close it. Preserve the persisted status.
    data.meta.status = current.status;
  }

  const [earliestFollowUp] = await db
    .select({ date: followUps.followUpDate })
    .from(followUps)
    .where(eq(followUps.caseId, current.id))
    .orderBy(asc(followUps.followUpDate))
    .limit(1);
  if (earliestFollowUp && data.meta.registrationDate > earliestFollowUp.date) {
    return { ok: false, error: "تاريخ تسجيل الحالة لا يمكن أن يكون بعد تاريخ متابعة مسجل بالفعل" };
  }

  try {
    await db.transaction(async (tx) => {
      if (data.meta.assignedUserId) {
        const [assigned] = await tx
          .select({ id: users.id })
          .from(users)
          .innerJoin(roles, eq(users.roleId, roles.id))
          .where(and(eq(users.id, data.meta.assignedUserId), eq(users.centerId, user.centerId), eq(users.status, "ACTIVE"), eq(roles.name, "SPECIALIST")))
          .limit(1);
        if (!assigned) throw new Error("المستخدم المعيّن غير تابع للمركز");
      }

      // Child identity/health profile is parent-owned and shared across centers.
      // Center staff may view it but must not silently mutate the global child record.
      if (user.role === "SUPER_ADMIN") {
        await tx.update(children).set({
          firstName: data.child.firstName, middleName: data.child.middleName ?? null, lastName: data.child.lastName,
          dateOfBirth: data.child.dateOfBirth, gender: data.child.gender, nationalId: data.child.nationalId ?? null,
          city: data.child.city ?? null, address: data.child.address ?? null, phone: data.child.phone ?? null,
          updatedAt: new Date(),
        }).where(eq(children.id, current.childId));
      }

      const [existingFamily] = await tx.select({ id: families.id }).from(families).where(eq(families.caseId, current.id)).limit(1);
      const familyValues = {
        fatherName: data.family.fatherName ?? null,
        fatherPhone: data.family.fatherPhone ?? null,
        motherName: data.family.motherName ?? null,
        motherPhone: data.family.motherPhone ?? null,
        maritalStatus: data.family.maritalStatus ?? null,
        familyMembersCount: data.family.familyMembersCount ?? null,
        address: data.family.address ?? null,
        notes: data.family.notes ?? null,
      };
      if (existingFamily) {
        await tx.update(families).set(familyValues).where(eq(families.id, existingFamily.id));
      } else {
        await tx.insert(families).values({ caseId: current.id, ...familyValues });
      }

      await tx.update(cases).set({
        assignedUserId: data.meta.assignedUserId ?? null,
        status: data.meta.status,
        priority: data.meta.priority,
        registrationDate: data.meta.registrationDate,
        updatedAt: new Date(),
      }).where(eq(cases.id, current.id));

      await tx.delete(diagnoses).where(eq(diagnoses.caseId, current.id));
      await tx.insert(diagnoses).values(data.diagnoses.map((d) => ({
        caseId: current.id,
        disabilityId: d.disabilityId,
        diagnosisName: d.diagnosisName,
        diagnosisDate: d.diagnosisDate,
        severity: d.severity,
        diagnosedBy: d.diagnosedBy ?? null,
        notes: d.notes ?? null,
      })));

      const existingServices = await tx.select({ id: caseServices.id }).from(caseServices).where(eq(caseServices.caseId, current.id));
      const submittedIds = new Set<string>();
      for (const s of data.services) {
        const [service] = await tx
          .select({ id: services.id })
          .from(services)
          .where(and(eq(services.id, s.serviceId), eq(services.status, "ACTIVE")))
          .limit(1);
        if (!service) throw new Error("الخدمة المحددة غير متاحة");
        if (s.specialistId) {
          const [specialist] = await tx.select({ id: users.id }).from(users).innerJoin(roles, eq(users.roleId, roles.id)).where(and(eq(users.id, s.specialistId), eq(users.centerId, user.centerId), eq(users.status, "ACTIVE"), eq(roles.name, "SPECIALIST"))).limit(1);
          if (!specialist) throw new Error("الأخصائي المحدد للخدمة غير تابع للمركز");
        }
        if (s.status === "COMPLETED" && s.startDate > new Date().toISOString().slice(0, 10)) throw new Error("لا يمكن إكمال خدمة لم تبدأ بعد");
        const values = { serviceId: s.serviceId, startDate: s.startDate, endDate: s.endDate ?? (s.status === "COMPLETED" || s.status === "CANCELLED" ? new Date().toISOString().slice(0, 10) : null), status: s.status, specialistId: s.specialistId ?? null, notes: s.notes ?? null };
        if (s.id && existingServices.some((x) => x.id === s.id)) {
          submittedIds.add(s.id);
          await tx.update(caseServices).set(values).where(and(eq(caseServices.id, s.id), eq(caseServices.caseId, current.id)));
        } else {
          const [inserted] = await tx.insert(caseServices).values({ caseId: current.id, ...values }).returning({ id: caseServices.id });
          if (inserted) submittedIds.add(inserted.id);
        }
      }
      for (const existing of existingServices) {
        if (!submittedIds.has(existing.id)) {
          await tx.update(caseServices).set({
            status: "CANCELLED",
            endDate: new Date().toISOString().slice(0, 10),
          }).where(and(eq(caseServices.id, existing.id), eq(caseServices.caseId, current.id)));
        }
      }
    });

    await writeAuditLog({
      centerId: user.centerId,
      userId: user.id,
      action: "UPDATE_CASE",
      entityType: "case",
      entityId: current.id,
      oldValues: {
        status: current.status,
        priority: current.priority,
        assignedUserId: current.assignedUserId,
      },
      newValues: {
        status: data.meta.status,
        priority: data.meta.priority,
        assignedUserId: data.meta.assignedUserId ?? null,
      },
    });

    revalidatePath(`/cases/${current.id}`);
    revalidatePath("/cases");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "تعذّر تحديث الحالة" };
  }
}

// ============ Follow-up ============
const followUpSchema = z.object({
  caseId: z.string().uuid(),
  caseServiceId: z.string().uuid().optional(),
  followUpDate: z.string().min(1),
  progress: z.enum(["IMPROVING", "STABLE", "DECLINING", "NEEDS_REVIEW"]),
  observations: z.string().min(1, "الملاحظات مطلوبة"),
  recommendations: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
}).superRefine((v, ctx) => {
  const today = new Date().toISOString().slice(0, 10);
  if (v.followUpDate > today) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["followUpDate"], message: "تاريخ المتابعة لا يمكن أن يكون في المستقبل" });
  }
  if (v.nextFollowUpDate && v.nextFollowUpDate < v.followUpDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nextFollowUpDate"], message: "موعد المتابعة القادمة يجب أن يكون بعد تاريخ المتابعة" });
  }
});

export async function createFollowUp(formData: unknown) {
  const user = await getSessionOrThrow();
  if (!canAddFollowUps(user.role)) throw new Error("لا تملك صلاحية");

  const parsed = followUpSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: "البيانات غير صالحة" };
  const d = parsed.data;

  const [c] = await db
    .select({ id: cases.id, centerId: cases.centerId, status: cases.status })
    .from(cases)
    .where(eq(cases.id, d.caseId));
  if (!c) return { ok: false, error: "الحالة غير موجودة" };
  if (c.centerId !== user.centerId) return { ok: false, error: "لا تملك صلاحية الوصول" };
  if (c.status === "CLOSED" || c.status === "ARCHIVED") return { ok: false, error: "لا يمكن إضافة متابعة لحالة مغلقة أو مؤرشفة" };
  if (d.caseServiceId) {
    const [linkedService] = await db.select({ id: caseServices.id }).from(caseServices).where(and(eq(caseServices.id, d.caseServiceId), eq(caseServices.caseId, c.id), eq(caseServices.status, "ACTIVE"))).limit(1);
    if (!linkedService) return { ok: false, error: "الخدمة المحددة غير نشطة أو لا تنتمي لهذه الحالة" };
  }

  const [fu] = await db
    .insert(followUps)
    .values({
      caseId: c.id,
      caseServiceId: d.caseServiceId ?? null,
      specialistId: user.id,
      followUpDate: d.followUpDate,
      progress: d.progress,
      observations: d.observations,
      recommendations: d.recommendations ?? null,
      nextFollowUpDate: d.nextFollowUpDate ?? null,
    })
    .returning();

  await writeAuditLog({
    centerId: user.centerId,
    userId: user.id,
    action: "CREATE_FOLLOWUP",
    entityType: "follow_up",
    entityId: fu.id,
  });

  revalidatePath(`/cases/${c.id}`);
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  return { ok: true, id: fu.id };
}

// ============ Service Lifecycle ============
const caseServiceStatusSchema = z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]);

export async function updateCaseServiceStatus(caseServiceId: string, status: z.infer<typeof caseServiceStatusSchema>) {
  const user = await getSessionOrThrow();
  if (!canEditCases(user.role)) throw new Error("لا تملك صلاحية إدارة الخدمات");
  const parsed = caseServiceStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error("حالة الخدمة غير صالحة");
  const [row] = await db.select({ id: caseServices.id, caseId: caseServices.caseId, centerId: cases.centerId, oldStatus: caseServices.status, startDate: caseServices.startDate }).from(caseServices).innerJoin(cases, eq(caseServices.caseId, cases.id)).where(and(eq(caseServices.id, caseServiceId), eq(cases.centerId, user.centerId))).limit(1);
  if (!row) throw new Error("الخدمة غير موجودة");
  const nextStatus = parsed.data;
  if (nextStatus === "COMPLETED" && row.startDate > new Date().toISOString().slice(0, 10)) throw new Error("لا يمكن إكمال خدمة لم تبدأ بعد");
  await db.update(caseServices).set({ status: nextStatus, endDate: nextStatus === "COMPLETED" || nextStatus === "CANCELLED" ? new Date().toISOString().slice(0, 10) : null }).where(eq(caseServices.id, row.id));
  await writeAuditLog({ centerId: user.centerId, userId: user.id, action: "UPDATE_CASE_SERVICE_STATUS", entityType: "case_service", entityId: row.id, oldValues: { status: row.oldStatus }, newValues: { status: nextStatus, caseId: row.caseId } });
  revalidatePath(`/cases/${row.caseId}`); revalidatePath("/dashboard"); revalidatePath("/follow-ups");
  return { ok: true };
}

// ============ Update Case Status ============
export async function updateCaseStatus(caseId: string, status: "ACTIVE" | "ON_HOLD" | "CLOSED" | "ARCHIVED") {
  const user = await getSessionOrThrow();
  const [c] = await db.select({ centerId: cases.centerId }).from(cases).where(eq(cases.id, caseId));
  if (!c || c.centerId !== user.centerId) throw new Error("غير مصرّح");
  if (!canChangeCaseStatus(user.role)) throw new Error("لا تملك صلاحية تغيير حالة الملف");

  await db.update(cases).set({ status, updatedAt: new Date() }).where(eq(cases.id, caseId));
  await writeAuditLog({ centerId: user.centerId, userId: user.id, action: "UPDATE_CASE_STATUS", entityType: "case", entityId: caseId, newValues: { status } });
  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
  return { ok: true };
}

// ============ Add Note ============
export async function addNote(caseId: string, content: string) {
  const user = await getSessionOrThrow();
  if (!canEditCases(user.role)) throw new Error("لا تملك صلاحية إضافة الملاحظات");
  const [c] = await db.select({ centerId: cases.centerId }).from(cases).where(eq(cases.id, caseId));
  if (!c || c.centerId !== user.centerId) throw new Error("غير مصرّح");

  if (!content || content.trim().length < 3) return { ok: false, error: "محتوى الملاحظة قصير جدًا" };
  const [note] = await db.insert(notes).values({ caseId, userId: user.id, content: content.trim() }).returning({ id: notes.id });
  await writeAuditLog({ centerId: user.centerId, userId: user.id, action: "CREATE_NOTE", entityType: "note", entityId: note.id });
  revalidatePath(`/cases/${caseId}`);
  return { ok: true };
}

// ============ Upload medical report metadata ============
export async function createMedicalReport(caseId: string, formData: FormData) {
  const user = await getSessionOrThrow();
  if (!canUploadDocuments(user.role)) throw new Error("لا تملك صلاحية إضافة التقارير");
  const [c] = await db.select({ centerId: cases.centerId }).from(cases).where(eq(cases.id, caseId));
  if (!c || c.centerId !== user.centerId) throw new Error("غير مصرّح");

  const reportType = String(formData.get("reportType") ?? "تقرير طبي");
  const reportDate = String(formData.get("reportDate") ?? new Date().toISOString().slice(0, 10));
  const issuedBy = String(formData.get("issuedBy") ?? "");
  const description = String(formData.get("description") ?? "");
  const today = new Date().toISOString().slice(0, 10);
  if (!reportDate || reportDate > today) return { ok: false, error: "تاريخ التقرير لا يمكن أن يكون في المستقبل" };
  if (reportType.trim().length < 2) return { ok: false, error: "نوع التقرير غير صالح" };

  const [report] = await db.insert(medicalReports).values({
    caseId,
    reportType,
    reportDate,
    issuedBy: issuedBy || null,
    description: description || null,
    uploadedBy: user.id,
  }).returning({ id: medicalReports.id });

  await writeAuditLog({ centerId: user.centerId, userId: user.id, action: "CREATE_MEDICAL_REPORT", entityType: "medical_report", entityId: report.id });
  revalidatePath(`/cases/${caseId}`);
  return { ok: true };
}

// ============ Account security ============
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "أدخل كلمة المرور الحالية"),
  newPassword: z.string().min(10, "كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل"),
  confirmPassword: z.string().min(1),
}).superRefine((v, ctx) => {
  if (v.newPassword !== v.confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "كلمتا المرور غير متطابقتين" });
  }
  if (v.newPassword === v.currentPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["newPassword"], message: "اختر كلمة مرور مختلفة عن الحالية" });
  }
});

export async function changeOwnPassword(formData: unknown) {
  const user = await getSessionOrThrow();
  const parsed = changePasswordSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "البيانات غير صالحة" };

  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(and(eq(users.id, user.id), eq(users.centerId, user.centerId))).limit(1);
  if (!row || !(await compare(parsed.data.currentPassword, row.passwordHash))) {
    await writeAuditLog({ centerId: user.centerId, userId: user.id, action: "PASSWORD_CHANGE_FAILED", entityType: "user", entityId: user.id });
    return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(and(eq(users.id, user.id), eq(users.centerId, user.centerId)));
  await writeAuditLog({ centerId: user.centerId, userId: user.id, action: "PASSWORD_CHANGED", entityType: "user", entityId: user.id });
  return { ok: true };
}

// ============ Users management ============
const userSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  role: z.enum(["CENTER_ADMIN", "SPECIALIST", "DATA_ENTRY", "VIEWER"]),
  password: z.string().min(10, "كلمة المرور يجب أن تكون 10 أحرف على الأقل"),
});

export async function createUser(formData: unknown) {
  const user = await getSessionOrThrow();
  if (!canCreateUsers(user.role)) throw new Error("لا تملك صلاحية إنشاء المستخدمين");

  const parsed = userSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: "البيانات غير صالحة" };

  const d = parsed.data;
  const normalizedEmail = d.email.trim().toLowerCase();
  const [role] = await db.select().from(roles).where(eq(roles.name, d.role));
  if (!role) return { ok: false, error: "الدور غير موجود" };

  const result = await db.transaction(async (tx) => {
    // Serialize account creation by normalized email so Parent and Center accounts
    // cannot race past the cross-table uniqueness checks.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`special-care-email-${normalizedEmail}`}))`);

    const existingUser = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (existingUser.length) return { ok: false as const, error: "البريد مستخدم مسبقًا" };

    const existingParent = await tx
      .select({ id: parents.id })
      .from(parents)
      .where(eq(parents.email, normalizedEmail))
      .limit(1);
    if (existingParent.length) return { ok: false as const, error: "هذا البريد مستخدم بالفعل في حساب ولي أمر" };

    const passwordHash = await hashPassword(d.password);
    const [created] = await tx
      .insert(users)
      .values({
        centerId: user.centerId,
        name: d.name,
        email: normalizedEmail,
        phone: d.phone ?? null,
        roleId: role.id,
        passwordHash,
        status: "ACTIVE",
      })
      .returning();
    return { ok: true as const, user: created };
  });

  if (!result.ok) return result;
  await writeAuditLog({ centerId: user.centerId, userId: user.id, action: "CREATE_USER", entityType: "user", entityId: result.user.id });
  revalidatePath("/users");
  return { ok: true };
}

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(["CENTER_ADMIN", "SPECIALIST", "DATA_ENTRY", "VIEWER"]),
});

export async function updateUser(formData: unknown) {
  const actor = await getSessionOrThrow();
  if (!canEditUsers(actor.role)) throw new Error("لا تملك صلاحية تعديل المستخدمين");
  const parsed = updateUserSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: "البيانات غير صالحة" };
  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`special-care-user-admin-${actor.centerId}`}))`);

    const [target] = await tx
      .select({ id: users.id, centerId: users.centerId, roleId: users.roleId, role: roles.name, name: users.name, phone: users.phone, status: users.status })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.id, data.userId), eq(users.centerId, actor.centerId)))
      .limit(1);
    if (!target) return { ok: false as const, error: "المستخدم غير موجود" };
    if (target.id === actor.id && data.role !== target.role) return { ok: false as const, error: "لا يمكنك تغيير دور حسابك بنفسك" };

    const [newRole] = await tx.select({ id: roles.id, name: roles.name }).from(roles).where(eq(roles.name, data.role)).limit(1);
    if (!newRole) return { ok: false as const, error: "الدور غير موجود" };

    if (target.status === "ACTIVE" && target.role === "CENTER_ADMIN" && data.role !== "CENTER_ADMIN") {
      const activeAdmins = await tx
        .select({ id: users.id })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(and(eq(users.centerId, actor.centerId), eq(users.status, "ACTIVE"), eq(roles.name, "CENTER_ADMIN")));
      if (activeAdmins.length <= 1) {
        return { ok: false as const, error: "لا يمكن إزالة دور آخر مدير نشط للمركز" };
      }
    }

    await tx.update(users).set({
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      roleId: newRole.id,
      updatedAt: new Date(),
    }).where(and(eq(users.id, target.id), eq(users.centerId, actor.centerId)));

    return {
      ok: true as const,
      target,
      newRole: data.role,
      newName: data.name.trim(),
      newPhone: data.phone?.trim() || null,
    };
  });

  if (!result.ok) return result;
  await writeAuditLog({
    centerId: actor.centerId,
    userId: actor.id,
    action: "UPDATE_USER",
    entityType: "user",
    entityId: result.target.id,
    oldValues: { name: result.target.name, phone: result.target.phone, role: result.target.role },
    newValues: { name: result.newName, phone: result.newPhone, role: result.newRole },
  });
  revalidatePath("/users");
  return { ok: true };
}

export async function toggleUserStatus(userId: string) {
  const user = await getSessionOrThrow();
  if (!canEditUsers(user.role)) throw new Error("لا تملك صلاحية تعديل المستخدمين");

  const result = await db.transaction(async (tx) => {
    // Serialize admin-status changes per center so two concurrent requests cannot
    // both disable the last active center administrator.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`special-care-user-status-${user.centerId}`}))`);

    const [target] = await tx.select().from(users).where(and(eq(users.id, userId), eq(users.centerId, user.centerId)));
    if (!target) throw new Error("غير مصرّح");
    if (target.id === user.id) return { ok: false as const, error: "لا يمكنك تعطيل حسابك" };

    const newStatus = target.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    if (newStatus === "DISABLED") {
      const activeAdmins = await tx
        .select({ id: users.id })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(and(eq(users.centerId, user.centerId), eq(users.status, "ACTIVE"), eq(roles.name, "CENTER_ADMIN")));
      if (activeAdmins.length <= 1 && activeAdmins.some((a) => a.id === target.id)) {
        return { ok: false as const, error: "لا يمكن تعطيل آخر مدير نشط للمركز" };
      }
    }

    await tx.update(users).set({ status: newStatus, updatedAt: new Date() }).where(and(eq(users.id, userId), eq(users.centerId, user.centerId)));
    return { ok: true as const, target, newStatus };
  });

  if (!result.ok) return result;
  const { target, newStatus } = result;
  await writeAuditLog({ centerId: user.centerId, userId: user.id, action: "TOGGLE_USER_STATUS", entityType: "user", entityId: userId, oldValues: { status: target.status }, newValues: { status: newStatus } });
  revalidatePath("/users");
  return { ok: true };
}

export async function markNotificationRead(id: string) {
  const user = await getSessionOrThrow();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(sql`${notifications.id} = ${id} AND ${notifications.userId} = ${user.id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

// ============================
// Super Admin — center management
// ============================
const centerCreateSchema = z.object({
  name: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/), phone: z.string().optional(), email: z.string().email().optional().or(z.literal("")), address: z.string().optional(), description: z.string().optional(), adminName: z.string().min(2), adminEmail: z.string().email(), adminPassword: z.string().min(10),
});

export async function createCenter(formData: FormData) {
  const user = await getSessionOrThrow();
  if (user.accountType !== "CENTER" || user.role !== "SUPER_ADMIN" || !canManageCenters(user.role)) throw new Error("غير مصرح");
  const parsed = centerCreateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const data = parsed.data;
  const adminEmail = data.adminEmail.toLowerCase();
  const [adminRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, "CENTER_ADMIN")).limit(1);
  if (!adminRole) throw new Error("دور مدير المركز غير موجود");
  const passwordHash = await hashPassword(data.adminPassword);
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`special-care-center-${data.slug}`}))`);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`special-care-email-${adminEmail}`}))`);

    const existingCenter = await tx.select({ id: centers.id }).from(centers).where(eq(centers.slug, data.slug)).limit(1);
    if (existingCenter.length) throw new Error("رابط المركز مستخدم بالفعل");
    const existingAdmin = await tx.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
    if (existingAdmin.length) throw new Error("بريد مدير المركز مستخدم بالفعل");
    const [existingParent] = await tx.select({ id: parents.id }).from(parents).where(eq(parents.email, adminEmail)).limit(1);
    if (existingParent) throw new Error("هذا البريد مستخدم بالفعل في حساب ولي أمر");

    const [center] = await tx.insert(centers).values({ name: data.name, slug: data.slug, phone: data.phone || null, email: data.email || null, address: data.address || null, description: data.description || null }).returning({ id: centers.id });
    await tx.insert(users).values({ centerId: center.id, name: data.adminName, email: adminEmail, passwordHash, roleId: adminRole.id, status: "ACTIVE" });
    return center;
  });
  revalidatePath("/centers");
  revalidatePath("/admin/centers");
  return { ok: true, centerId: result.id };
}

// ============================
// Parent Portal — account & child enrollment
// ============================
const parentRegisterSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").transform((v) => v.trim().toLowerCase()),
  phone: z.string().min(6, "رقم الهاتف مطلوب"),
  password: z.string().min(10, "كلمة المرور يجب ألا تقل عن 10 أحرف"),
});

export async function registerParent(formData: FormData) {
  const parsed = parentRegisterSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  const email = parsed.data.email;
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`special-care-email-${email}`}))`);
    const existing = await tx.select({ id: parents.id }).from(parents).where(eq(parents.email, email)).limit(1);
    if (existing.length) return { ok: false as const, error: "هذا البريد مستخدم بالفعل" };
    const [existingCenterUser] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existingCenterUser) return { ok: false as const, error: "هذا البريد مستخدم بالفعل في حساب مركز" };
    const passwordHash = await hashPassword(parsed.data.password);
    const [parent] = await tx.insert(parents).values({ ...parsed.data, email, passwordHash }).returning({ id: parents.id });
    return { ok: true as const, parentId: parent.id };
  });
  return result;
}

const parentChildSchema = z.object({
  firstName: z.string().min(1), middleName: z.string().optional(), lastName: z.string().min(1),
  dateOfBirth: z.string().min(1), gender: z.enum(["MALE", "FEMALE"]), nationalId: z.string().optional(),
  city: z.string().optional(), address: z.string().optional(), phone: z.string().optional(), notes: z.string().optional(),
  disabilityId: z.string().uuid().optional().or(z.literal("")),
  diagnosisName: z.string().optional(), diagnosisDate: z.string().optional(),
  severity: z.enum(["MILD", "MODERATE", "SEVERE", "PROFOUND"]).optional().or(z.literal("")),
  careSummary: z.string().optional(),
}).superRefine((v, ctx) => {
  const today = new Date().toISOString().slice(0, 10);
  if (v.dateOfBirth > today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateOfBirth"], message: "تاريخ الميلاد لا يمكن أن يكون في المستقبل" });
  if (v.diagnosisDate && v.diagnosisDate > today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["diagnosisDate"], message: "تاريخ التشخيص لا يمكن أن يكون في المستقبل" });
  if (v.diagnosisDate && v.diagnosisDate < v.dateOfBirth) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["diagnosisDate"], message: "تاريخ التشخيص لا يمكن أن يسبق تاريخ الميلاد" });
});

export async function createParentChild(formData: FormData) {
  const user = await getSessionOrThrow();
  if (user.accountType !== "PARENT" || !user.parentId) throw new Error("غير مصرح");
  const parsed = parentChildSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const data = parsed.data;
  const result = await db.transaction(async (tx) => {
    const [child] = await tx.insert(children).values({
      firstName: data.firstName, middleName: data.middleName || null, lastName: data.lastName,
      dateOfBirth: data.dateOfBirth, gender: data.gender, nationalId: data.nationalId || null,
      city: data.city || null, address: data.address || null, phone: data.phone || null, notes: data.notes || null,
    }).returning({ id: children.id });
    await tx.insert(parentChildren).values({ parentId: user.parentId, childId: child.id, relationship: "PARENT", isPrimary: true });
    await tx.insert(childProfiles).values({
      childId: child.id, disabilityId: data.disabilityId || null, diagnosisName: data.diagnosisName || null,
      diagnosisDate: data.diagnosisDate || null, severity: data.severity || null, careSummary: data.careSummary || null,
      updatedByParentId: user.parentId,
    });
    return child;
  });
  revalidatePath("/parent");
  return { ok: true, childId: result.id };
}

export async function joinCenter(formData: FormData) {
  const user = await getSessionOrThrow();
  if (user.accountType !== "PARENT" || !user.parentId) throw new Error("غير مصرح");
  const childId = String(formData.get("childId") ?? "");
  const centerId = String(formData.get("centerId") ?? "");
  if (!z.string().uuid().safeParse(childId).success || !z.string().uuid().safeParse(centerId).success) throw new Error("بيانات الطفل أو المركز غير صحيحة");

  try {
    const result = await db.transaction(async (tx) => {
      const [owned] = await tx.select({ id: parentChildren.id }).from(parentChildren)
        .where(and(eq(parentChildren.parentId, user.parentId!), eq(parentChildren.childId, childId))).limit(1);
      if (!owned) throw new Error("هذا الطفل غير تابع لحسابك");
      const [center] = await tx.select({ id: centers.id, name: centers.name }).from(centers)
        .where(and(eq(centers.id, centerId), eq(centers.status, "ACTIVE"))).limit(1);
      if (!center) throw new Error("المركز غير متاح");

      const [membership] = await tx.select({ id: childCenters.id, status: childCenters.status })
        .from(childCenters).where(and(eq(childCenters.childId, childId), eq(childCenters.centerId, centerId))).limit(1);
      if (!membership) {
        await tx.insert(childCenters).values({ childId, centerId, status: "ACTIVE" });
      } else if (membership.status !== "ACTIVE") {
        await tx.update(childCenters).set({ status: "ACTIVE", endedAt: null }).where(eq(childCenters.id, membership.id));
      }

      let [existingCase] = await tx.select({ id: cases.id, caseNumber: cases.caseNumber })
        .from(cases).where(and(eq(cases.childId, childId), eq(cases.centerId, centerId))).limit(1);
      if (!existingCase) {
        const year = new Date().getFullYear();
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`special-care-case-number-${year}`}))`);
        const seqRes = await tx.execute(sql`SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 10) AS INTEGER)), 0) + 1 AS seq FROM cases WHERE case_number LIKE ${`SC-${year}-%`}`);
        const seqRows = Array.isArray(seqRes) ? seqRes : (seqRes as any)?.rows ?? [];
        const seq = Number(seqRows[0]?.seq ?? 1);
        const caseNumber = `SC-${year}-${String(seq).padStart(6, "0")}`;
        const [profile] = await tx.select().from(childProfiles).where(eq(childProfiles.childId, childId)).limit(1);
        const [created] = await tx.insert(cases).values({ caseNumber, centerId, childId, registrationDate: new Date().toISOString().slice(0, 10), createdBy: null, status: "ACTIVE", priority: "NORMAL" }).returning({ id: cases.id, caseNumber: cases.caseNumber });
        existingCase = created;
        if (profile?.disabilityId && profile.diagnosisName && profile.diagnosisDate && profile.severity) {
          const [disability] = await tx.select({ id: disabilities.id }).from(disabilities).where(eq(disabilities.id, profile.disabilityId)).limit(1);
          if (disability) {
            await tx.insert(diagnoses).values({ caseId: created.id, disabilityId: disability.id, diagnosisName: profile.diagnosisName, diagnosisDate: profile.diagnosisDate, severity: profile.severity, diagnosedBy: "Parent profile", notes: profile.careSummary ?? null });
          }
        }
      }
      return { centerName: center.name, caseNumber: existingCase.caseNumber };
    });
    revalidatePath("/parent");
    revalidatePath("/centers");
    revalidatePath("/cases");
    return { ok: true, ...result };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "تعذر الانضمام للمركز" };
  }
}
