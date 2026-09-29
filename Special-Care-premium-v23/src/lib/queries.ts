import "server-only";
import { db } from "@/db";
import { attachments, auditLogs, cases, caseServices, childCenters, children, childProfiles, diagnoses, disabilities, families, followUps, medicalReports, notes, notifications, parentChildren, parents, roles, services, users, centers } from "@/db/schema";
import { and, asc, count, desc, eq, gte, like, lte, or } from "drizzle-orm";

export async function getCenterIntake(centerId: string) {
  return db.select({
    membershipId: childCenters.id, joinedAt: childCenters.joinedAt, status: childCenters.status,
    childId: children.id, firstName: children.firstName, middleName: children.middleName, lastName: children.lastName,
    dateOfBirth: children.dateOfBirth, gender: children.gender, phone: children.phone, city: children.city,
    parentName: parents.name, parentPhone: parents.phone, parentEmail: parents.email,
    caseId: cases.id, caseNumber: cases.caseNumber, caseStatus: cases.status, assignedUserName: users.name,
  }).from(childCenters)
    .innerJoin(children, eq(childCenters.childId, children.id))
    .leftJoin(parentChildren, eq(parentChildren.childId, children.id))
    .leftJoin(parents, eq(parentChildren.parentId, parents.id))
    .leftJoin(cases, and(eq(cases.childId, children.id), eq(cases.centerId, centerId)))
    .leftJoin(users, eq(cases.assignedUserId, users.id))
    .where(eq(childCenters.centerId, centerId)).orderBy(desc(childCenters.joinedAt));
}

export async function getDashboardStats(centerId: string) {
  const [total, active, joined, newMonth, upcoming, unassigned, withoutFollowUp, recentJoins, recentCases, upcomingRows, monthly, disabilityRows, ageRows] = await Promise.all([
    db.select({ v: count() }).from(cases).where(eq(cases.centerId, centerId)),
    db.select({ v: count() }).from(cases).where(and(eq(cases.centerId, centerId), eq(cases.status, "ACTIVE"))),
    db.select({ v: count() }).from(childCenters).where(and(eq(childCenters.centerId, centerId), eq(childCenters.status, "ACTIVE"))),
    db.select({ v: count() }).from(cases).where(and(eq(cases.centerId, centerId), gte(cases.registrationDate, new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)))),
    db.select({ v: count() }).from(followUps).innerJoin(cases, eq(followUps.caseId, cases.id)).where(and(eq(cases.centerId, centerId), gte(followUps.followUpDate, new Date().toISOString().slice(0,10)))),
    db.select({ v: count() }).from(cases).where(and(eq(cases.centerId, centerId), eq(cases.status, "ACTIVE"), eq(cases.assignedUserId, null as any))),
    db.select({ v: count() }).from(cases).where(eq(cases.centerId, centerId)),
    db.select({ membershipId: childCenters.id, joinedAt: childCenters.joinedAt, childId: children.id, firstName: children.firstName, lastName: children.lastName, dateOfBirth: children.dateOfBirth, parentName: parents.name, parentPhone: parents.phone }).from(childCenters).innerJoin(children, eq(childCenters.childId, children.id)).leftJoin(parentChildren, eq(parentChildren.childId, children.id)).leftJoin(parents, eq(parentChildren.parentId, parents.id)).where(and(eq(childCenters.centerId, centerId), eq(childCenters.status, "ACTIVE"))).orderBy(desc(childCenters.joinedAt)).limit(6),
    db.select({ id: cases.id, caseNumber: cases.caseNumber, status: cases.status, registrationDate: cases.registrationDate, firstName: children.firstName, lastName: children.lastName, dateOfBirth: children.dateOfBirth, gender: children.gender, specialistName: users.name }).from(cases).innerJoin(children, eq(cases.childId, children.id)).leftJoin(users, eq(cases.assignedUserId, users.id)).where(eq(cases.centerId, centerId)).orderBy(desc(cases.createdAt)).limit(5),
    db.select({ id: followUps.id, caseId: followUps.caseId, followUpDate: followUps.followUpDate, caseNumber: cases.caseNumber, firstName: children.firstName, lastName: children.lastName, specialistName: users.name }).from(followUps).innerJoin(cases, eq(followUps.caseId, cases.id)).innerJoin(children, eq(cases.childId, children.id)).leftJoin(users, eq(followUps.specialistId, users.id)).where(and(eq(cases.centerId, centerId), gte(followUps.followUpDate, new Date().toISOString().slice(0,10)))).orderBy(asc(followUps.followUpDate)).limit(6),
    db.select({ month: cases.registrationDate, total: count() }).from(cases).where(eq(cases.centerId, centerId)).groupBy(cases.registrationDate).orderBy(desc(cases.registrationDate)).limit(7),
    db.select({ name: disabilities.name, total: count() }).from(diagnoses).innerJoin(disabilities, eq(diagnoses.disabilityId, disabilities.id)).innerJoin(cases, eq(diagnoses.caseId, cases.id)).where(eq(cases.centerId, centerId)).groupBy(disabilities.name).orderBy(desc(count())).limit(6),
    db.select({ bucket: children.gender, total: count() }).from(cases).innerJoin(children, eq(cases.childId, children.id)).where(eq(cases.centerId, centerId)).groupBy(children.gender),
  ]);
  return {
    totalCases: Number(total[0]?.v ?? 0), activeCases: Number(active[0]?.v ?? 0), joinedChildrenCount: Number(joined[0]?.v ?? 0), newThisMonth: Number(newMonth[0]?.v ?? 0), upcomingFollowUps: Number(upcoming[0]?.v ?? 0),
    unassignedCases: Number(unassigned[0]?.v ?? 0), casesWithoutFollowUp: 0, recentJoins,
    recentCases, upcoming: upcomingRows,
    monthly: monthly.map((m) => ({ month: String(m.month).slice(0,7), total: String(m.total) })),
    byDisability: disabilityRows.map((d) => ({ name: d.name, total: String(d.total) })),
    ageDistribution: ageRows.map((d) => ({ bucket: String(d.bucket), total: String(d.total) })),
  };
}

export interface CasesListFilters {
  search?: string; disabilityId?: string; gender?: "MALE" | "FEMALE"; status?: "ACTIVE" | "ON_HOLD" | "CLOSED" | "ARCHIVED"; specialistId?: string;
  ageMin?: number; ageMax?: number; from?: string; to?: string; page?: number; pageSize?: number; sort?: "newest" | "oldest" | "name";
}

export async function listCases(centerId: string, filters: CasesListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1), pageSize = Math.min(50, Math.max(5, filters.pageSize ?? 10));
  const where = [eq(cases.centerId, centerId)];
  if (filters.status) where.push(eq(cases.status, filters.status));
  if (filters.specialistId) where.push(eq(cases.assignedUserId, filters.specialistId));
  if (filters.gender) where.push(eq(children.gender, filters.gender));
  if (filters.from) where.push(gte(cases.registrationDate, filters.from));
  if (filters.to) where.push(lte(cases.registrationDate, filters.to));
  if (filters.search) { const s = `%${filters.search}%`; where.push(or(like(children.firstName, s), like(children.middleName, s), like(children.lastName, s), like(cases.caseNumber, s), like(children.phone, s), like(children.nationalId, s))!); }
  const base = db.select({ id: cases.id, caseNumber: cases.caseNumber, status: cases.status, priority: cases.priority, registrationDate: cases.registrationDate, firstName: children.firstName, middleName: children.middleName, lastName: children.lastName, dateOfBirth: children.dateOfBirth, gender: children.gender, specialistName: users.name, assignedUserId: cases.assignedUserId }).from(cases).innerJoin(children, eq(cases.childId, children.id)).leftJoin(users, eq(cases.assignedUserId, users.id));
  const rows = await base.where(and(...where)).orderBy(filters.sort === "oldest" ? asc(cases.registrationDate) : filters.sort === "name" ? asc(children.firstName) : desc(cases.createdAt)).limit(pageSize).offset((page-1)*pageSize);
  const total = Number((await db.select({ v: count() }).from(cases).innerJoin(children, eq(cases.childId, children.id)).where(and(...where)))[0]?.v ?? 0);
  const ids = rows.map(r => r.id);
  let diagnosisMap = new Map<string,string>();
  let followMap = new Map<string,string>();
  if (ids.length) {
    const ds = await db.select({ caseId: diagnoses.caseId, name: diagnoses.diagnosisName, createdAt: diagnoses.createdAt }).from(diagnoses).where(eq(diagnoses.caseId, ids[0]));
    if (ds[0]) diagnosisMap.set(ds[0].caseId, ds[0].name);
    const fs = await db.select({ caseId: followUps.caseId, date: followUps.followUpDate }).from(followUps).where(eq(followUps.caseId, ids[0])).orderBy(desc(followUps.followUpDate));
    if (fs[0]) followMap.set(fs[0].caseId, String(fs[0].date));
  }
  return { rows: rows.map(r => ({ ...r, primaryDiagnosis: diagnosisMap.get(r.id) ?? null, lastFollowUp: followMap.get(r.id) ?? null })), total, page, pageSize };
}

export async function getCaseDetail(centerId: string | null, caseId: string) {
  const c = (await db.select().from(cases).where(centerId ? and(eq(cases.id, caseId), eq(cases.centerId, centerId)) : eq(cases.id, caseId)).limit(1))[0];
  if (!c) return null;
  const [center, child, family, diagnosesRows, servicesRows, followRows, reports, attachmentsRows, notesRows, parentRows, profileRows, assignedUser] = await Promise.all([
    db.select({ id: centers.id, name: centers.name, phone: centers.phone, address: centers.address }).from(centers).where(eq(centers.id, c.centerId)).limit(1),
    db.select().from(children).where(eq(children.id, c.childId)).limit(1),
    db.select().from(families).where(eq(families.caseId, c.id)).limit(1),
    db.select({ id: diagnoses.id, disabilityId: diagnoses.disabilityId, diagnosisName: diagnoses.diagnosisName, diagnosisDate: diagnoses.diagnosisDate, severity: diagnoses.severity, diagnosedBy: diagnoses.diagnosedBy, notes: diagnoses.notes, disabilityName: disabilities.name }).from(diagnoses).leftJoin(disabilities, eq(diagnoses.disabilityId, disabilities.id)).where(eq(diagnoses.caseId, c.id)).orderBy(desc(diagnoses.createdAt)),
    db.select({ id: caseServices.id, serviceId: caseServices.serviceId, specialistId: caseServices.specialistId, startDate: caseServices.startDate, endDate: caseServices.endDate, status: caseServices.status, notes: caseServices.notes, serviceName: services.name, specialistName: users.name }).from(caseServices).innerJoin(services, eq(caseServices.serviceId, services.id)).leftJoin(users, eq(caseServices.specialistId, users.id)).where(eq(caseServices.caseId, c.id)),
    db.select({ id: followUps.id, caseServiceId: followUps.caseServiceId, followUpDate: followUps.followUpDate, progress: followUps.progress, observations: followUps.observations, recommendations: followUps.recommendations, nextFollowUpDate: followUps.nextFollowUpDate, specialistName: users.name }).from(followUps).leftJoin(users, eq(followUps.specialistId, users.id)).where(eq(followUps.caseId, c.id)).orderBy(desc(followUps.followUpDate)),
    db.select().from(medicalReports).where(eq(medicalReports.caseId, c.id)).orderBy(desc(medicalReports.reportDate)),
    db.select().from(attachments).where(eq(attachments.caseId, c.id)).orderBy(desc(attachments.createdAt)),
    db.select({ id: notes.id, content: notes.content, createdAt: notes.createdAt, authorName: users.name }).from(notes).leftJoin(users, eq(notes.userId, users.id)).where(eq(notes.caseId, c.id)).orderBy(desc(notes.createdAt)),
    db.select({ id: parents.id, name: parents.name, email: parents.email, phone: parents.phone, relationship: parentChildren.relationship }).from(parentChildren).innerJoin(parents, eq(parentChildren.parentId, parents.id)).where(eq(parentChildren.childId, c.childId)).limit(1),
    db.select({ profile: childProfiles, disabilityName: disabilities.name }).from(childProfiles).leftJoin(disabilities, eq(childProfiles.disabilityId, disabilities.id)).where(eq(childProfiles.childId, c.childId)).limit(1),
    c.assignedUserId ? db.select().from(users).where(eq(users.id, c.assignedUserId)).limit(1) : Promise.resolve([] as any[]),
  ]);
  return { case: c, center: center[0] ?? null, child: child[0], family: family[0] ?? null, diagnoses: diagnosesRows, services: servicesRows, followUps: followRows, reports, attachments: attachmentsRows, notes: notesRows, parent: parentRows[0] ?? null, globalProfile: profileRows[0] ?? null, assignedUser: assignedUser[0] ?? null };
}

export async function getReferenceData(centerId: string) {
  const [specialists, disList, srvList, centerUsers] = await Promise.all([
    db.select({ id: users.id, name: users.name }).from(users).innerJoin(roles, eq(users.roleId, roles.id)).where(and(eq(users.centerId, centerId), eq(roles.name, "SPECIALIST"), eq(users.status, "ACTIVE"))),
    db.select().from(disabilities).orderBy(disabilities.name),
    db.select().from(services).where(eq(services.status, "ACTIVE")).orderBy(services.name),
    db.select({ id: users.id, name: users.name, email: users.email, role: roles.name, status: users.status, lastLoginAt: users.lastLoginAt }).from(users).innerJoin(roles, eq(users.roleId, roles.id)).where(eq(users.centerId, centerId)).orderBy(users.name),
  ]);
  return { specialists, disabilities: disList, services: srvList, centerUsers };
}

export async function listNotifications(userId: string) { return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(20); }
export async function markNotificationRead(id: string, userId: string) { await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId))); }

export async function listUsers(centerId: string) {
  return db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, status: users.status, lastLoginAt: users.lastLoginAt, role: roles.name, roleLabel: roles.label, createdAt: users.createdAt }).from(users).innerJoin(roles, eq(users.roleId, roles.id)).where(eq(users.centerId, centerId)).orderBy(users.name);
}

export async function getProgressAnalytics(centerId: string) {
  const progress = await db.select({ progress: followUps.progress, total: count() }).from(followUps).innerJoin(cases, eq(followUps.caseId, cases.id)).where(eq(cases.centerId, centerId)).groupBy(followUps.progress);
  const serviceStatus = await db.select({ status: caseServices.status, total: count() }).from(caseServices).innerJoin(cases, eq(caseServices.caseId, cases.id)).where(eq(cases.centerId, centerId)).groupBy(caseServices.status);
  const specialistLoad = await db.select({ name: users.name, total: count() }).from(followUps).innerJoin(cases, eq(followUps.caseId, cases.id)).innerJoin(users, eq(followUps.specialistId, users.id)).where(eq(cases.centerId, centerId)).groupBy(users.name).orderBy(desc(count())).limit(8);
  return { progress, serviceProgress: [], serviceStatus, specialistLoad, overdueCases: 0 };
}

export async function getReportsData(centerId: string, filters: { from?: string; to?: string; disabilityId?: string; status?: string; gender?: "MALE" | "FEMALE"; specialistId?: string; ageMin?: number; ageMax?: number } = {}) {
  const where = [eq(cases.centerId, centerId)];
  if (filters.status) where.push(eq(cases.status, filters.status as any));
  if (filters.from) where.push(gte(cases.registrationDate, filters.from));
  if (filters.to) where.push(lte(cases.registrationDate, filters.to));
  if (filters.gender) where.push(eq(children.gender, filters.gender));
  if (filters.specialistId) where.push(eq(cases.assignedUserId, filters.specialistId));
  const [totalCases, byStatus, byGender, bySpecialist] = await Promise.all([
    db.select({ v: count() }).from(cases).innerJoin(children, eq(cases.childId, children.id)).where(and(...where)),
    db.select({ status: cases.status, total: count() }).from(cases).innerJoin(children, eq(cases.childId, children.id)).where(and(...where)).groupBy(cases.status),
    db.select({ gender: children.gender, total: count() }).from(cases).innerJoin(children, eq(cases.childId, children.id)).where(and(...where)).groupBy(children.gender),
    db.select({ name: users.name, total: count() }).from(cases).innerJoin(children, eq(cases.childId, children.id)).leftJoin(users, eq(cases.assignedUserId, users.id)).where(and(...where)).groupBy(users.name),
  ]);
  return { totalCases: Number(totalCases[0]?.v ?? 0), withFollowUps: 0, avgFollowUps: 0, byStatus, byGender, bySpecialist };
}

export async function writeAuditLog(params: { centerId?: string; userId: string; action: string; entityType: string; entityId?: string; oldValues?: unknown; newValues?: unknown; ipAddress?: string; userAgent?: string; }) {
  await db.insert(auditLogs).values({ centerId: params.centerId ?? null, userId: params.userId, action: params.action, entityType: params.entityType, entityId: params.entityId, oldValues: params.oldValues ?? null, newValues: params.newValues ?? null, ipAddress: params.ipAddress ?? null, userAgent: params.userAgent ?? null });
}

export interface AuditLogFilters { action?: string; entityType?: string; userId?: string; from?: string; to?: string; page?: number; pageSize?: number; }
export async function listAuditLogs(centerId: string, filters: AuditLogFilters = {}) {
  const page = Math.max(1, filters.page ?? 1), pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 25));
  const where = [eq(auditLogs.centerId, centerId)];
  if (filters.action) where.push(eq(auditLogs.action, filters.action));
  if (filters.entityType) where.push(eq(auditLogs.entityType, filters.entityType));
  if (filters.userId) where.push(eq(auditLogs.userId, filters.userId));
  const [rows, totals] = await Promise.all([
    db.select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, oldValues: auditLogs.oldValues, newValues: auditLogs.newValues, ipAddress: auditLogs.ipAddress, userAgent: auditLogs.userAgent, createdAt: auditLogs.createdAt, userName: users.name, userEmail: users.email }).from(auditLogs).leftJoin(users, eq(auditLogs.userId, users.id)).where(and(...where)).orderBy(desc(auditLogs.createdAt)).limit(pageSize).offset((page-1)*pageSize),
    db.select({ total: count() }).from(auditLogs).where(and(...where)),
  ]);
  return { rows, total: Number(totals[0]?.total ?? 0), page, pageSize };
}
