"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cases, caseServices, childCenters, roles, services, users } from "@/db/schema";
import { getCurrentAppUser } from "@/lib/session";
import { canEditCases } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/queries";

const schema = z.object({
  caseId: z.string().uuid(),
  specialistId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  startDate: z.string().optional(),
});

export async function configureIntake(formData: FormData) {
  const user = await getCurrentAppUser();
  if (!user || user.accountType === "PARENT" || !user.centerId || !canEditCases(user.role)) {
    throw new Error("لا تملك صلاحية إدارة انضمامات الأطفال");
  }

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "بيانات الإعداد غير صحيحة" };
  const data = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const [target] = await tx
        .select({ id: cases.id, childId: cases.childId, assignedUserId: cases.assignedUserId })
        .from(cases)
        .where(and(eq(cases.id, data.caseId), eq(cases.centerId, user.centerId!)))
        .limit(1);
      if (!target) throw new Error("ملف الحالة غير موجود في هذا المركز");

      const [membership] = await tx
        .select({ id: childCenters.id })
        .from(childCenters)
        .where(and(eq(childCenters.childId, target.childId), eq(childCenters.centerId, user.centerId!), eq(childCenters.status, "ACTIVE")))
        .limit(1);
      if (!membership) throw new Error("الطفل غير مرتبط حاليًا بهذا المركز");

      if (data.specialistId) {
        const [specialist] = await tx
          .select({ id: users.id })
          .from(users)
          .innerJoin(roles, eq(users.roleId, roles.id))
          .where(and(eq(users.id, data.specialistId), eq(users.centerId, user.centerId!), eq(users.status, "ACTIVE"), eq(roles.name, "SPECIALIST")))
          .limit(1);
        if (!specialist) throw new Error("الأخصائي غير تابع للمركز");
      }

      if (data.serviceId) {
        const [service] = await tx.select({ id: services.id }).from(services).where(and(eq(services.id, data.serviceId), eq(services.status, "ACTIVE"))).limit(1);
        if (!service) throw new Error("الخدمة غير متاحة");
      }

      await tx.update(cases).set({
        assignedUserId: data.specialistId || null,
        updatedAt: new Date(),
      }).where(eq(cases.id, target.id));

      if (data.serviceId) {
        const [existing] = await tx.select({ id: caseServices.id }).from(caseServices)
          .where(and(eq(caseServices.caseId, target.id), eq(caseServices.serviceId, data.serviceId))).limit(1);
        if (existing) {
          await tx.update(caseServices).set({ specialistId: data.specialistId || null, status: "ACTIVE", endDate: null, startDate: data.startDate || new Date().toISOString().slice(0, 10) }).where(eq(caseServices.id, existing.id));
        } else {
          await tx.insert(caseServices).values({
            caseId: target.id,
            serviceId: data.serviceId,
            startDate: data.startDate || new Date().toISOString().slice(0, 10),
            status: "ACTIVE",
            specialistId: data.specialistId || null,
          });
        }
      }

      return { oldAssignedUserId: target.assignedUserId, newAssignedUserId: data.specialistId || null };
    });

    await writeAuditLog({
      centerId: user.centerId,
      userId: user.id,
      action: "CONFIGURE_INTAKE",
      entityType: "case",
      entityId: data.caseId,
      oldValues: { assignedUserId: result.oldAssignedUserId },
      newValues: { assignedUserId: result.newAssignedUserId, serviceId: data.serviceId || null },
    });

    revalidatePath("/intake");
    revalidatePath(`/cases/${data.caseId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? "تعذر إعداد الحالة" };
  }
}
