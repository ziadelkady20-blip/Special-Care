import { pgTable, text, timestamp, integer, boolean, uuid, varchar, date, pgEnum, jsonb } from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "DISABLED"]);
export const centerStatusEnum = pgEnum("center_status", ["ACTIVE", "SUSPENDED"]);
export const roleNameEnum = pgEnum("role_name", ["SUPER_ADMIN", "CENTER_ADMIN", "SPECIALIST", "DATA_ENTRY", "VIEWER"]);
export const caseStatusEnum = pgEnum("case_status", ["ACTIVE", "ON_HOLD", "CLOSED", "ARCHIVED"]);
export const casePriorityEnum = pgEnum("case_priority", ["LOW", "NORMAL", "HIGH", "URGENT"]);
export const genderEnum = pgEnum("gender", ["MALE", "FEMALE"]);
export const maritalStatusEnum = pgEnum("marital_status", ["MARRIED", "DIVORCED", "SEPARATED", "WIDOWED", "SINGLE"]);
export const severityEnum = pgEnum("severity", ["MILD", "MODERATE", "SEVERE", "PROFOUND"]);
export const serviceStatusEnum = pgEnum("service_status", ["ACTIVE", "COMPLETED", "CANCELLED"]);
export const caseServiceStatusEnum = pgEnum("case_service_status", ["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]);
export const progressEnum = pgEnum("progress", ["IMPROVING", "STABLE", "DECLINING", "NEEDS_REVIEW"]);
export const parentStatusEnum = pgEnum("parent_status", ["ACTIVE", "DISABLED"]);
export const membershipStatusEnum = pgEnum("membership_status", ["PENDING", "ACTIVE", "SUSPENDED", "ENDED"]);
export const notificationTypeEnum = pgEnum("notification_type", ["INFO", "WARNING", "SUCCESS", "FOLLOWUP"]);

export const centers = pgTable("centers", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 255 }), address: text("address"), logo: text("logo"),
  status: centerStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  slug: varchar("slug", { length: 120 }).unique(), description: text("description"), coverImage: text("cover_image"), workingHours: text("working_hours"),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(), name: roleNameEnum("name").notNull().unique(), label: text("label").notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), centerId: uuid("center_id").notNull(), name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull(), passwordHash: text("password_hash").notNull(), phone: varchar("phone", { length: 32 }),
  roleId: uuid("role_id").notNull(), status: userStatusEnum("status").default("ACTIVE").notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const children = pgTable("children", {
  id: uuid("id").primaryKey().defaultRandom(), firstName: text("first_name").notNull(), middleName: text("middle_name"), lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(), gender: genderEnum("gender").notNull(), nationalId: varchar("national_id", { length: 32 }),
  address: text("address"), city: varchar("city", { length: 100 }), phone: varchar("phone", { length: 32 }), notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const parents = pgTable("parents", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(), phone: varchar("phone", { length: 32 }), status: parentStatusEnum("status").default("ACTIVE").notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const parentChildren = pgTable("parent_children", {
  id: uuid("id").primaryKey().defaultRandom(), parentId: uuid("parent_id").notNull(), childId: uuid("child_id").notNull(),
  relationship: text("relationship").notNull().default("PARENT"), isPrimary: boolean("is_primary").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const childCenters = pgTable("child_centers", {
  id: uuid("id").primaryKey().defaultRandom(), childId: uuid("child_id").notNull(), centerId: uuid("center_id").notNull(),
  status: membershipStatusEnum("status").default("ACTIVE").notNull(), joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }), parentNote: text("parent_note"),
});

export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(), caseNumber: varchar("case_number", { length: 32 }).notNull().unique(),
  centerId: uuid("center_id").notNull(), childId: uuid("child_id").notNull(), assignedUserId: uuid("assigned_user_id"),
  status: caseStatusEnum("status").default("ACTIVE").notNull(), priority: casePriorityEnum("priority").default("NORMAL").notNull(),
  registrationDate: date("registration_date").notNull(), createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const families = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(), caseId: uuid("case_id").notNull().unique(), fatherName: text("father_name"), fatherPhone: varchar("father_phone", { length: 32 }),
  motherName: text("mother_name"), motherPhone: varchar("mother_phone", { length: 32 }), maritalStatus: maritalStatusEnum("marital_status"),
  familyMembersCount: integer("family_members_count"), address: text("address"), notes: text("notes"),
});

export const disabilities = pgTable("disabilities", { id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull().unique() });

export const childProfiles = pgTable("child_profiles", {
  id: uuid("id").primaryKey().defaultRandom(), childId: uuid("child_id").notNull().unique(), disabilityId: uuid("disability_id"),
  diagnosisName: text("diagnosis_name"), diagnosisDate: date("diagnosis_date"), severity: severityEnum("severity"), careSummary: text("care_summary"),
  updatedByParentId: uuid("updated_by_parent_id"), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const diagnoses = pgTable("diagnoses", {
  id: uuid("id").primaryKey().defaultRandom(), caseId: uuid("case_id").notNull(), disabilityId: uuid("disability_id").notNull(),
  diagnosisName: text("diagnosis_name").notNull(), diagnosisDate: date("diagnosis_date").notNull(), severity: severityEnum("severity").notNull(),
  diagnosedBy: text("diagnosed_by"), notes: text("notes"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull().unique(), description: text("description"),
  status: serviceStatusEnum("status").default("ACTIVE").notNull(),
});

export const centerServices = pgTable("center_services", {
  id: uuid("id").primaryKey().defaultRandom(), centerId: uuid("center_id").notNull(), serviceId: uuid("service_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const caseServices = pgTable("case_services", {
  id: uuid("id").primaryKey().defaultRandom(), caseId: uuid("case_id").notNull(), serviceId: uuid("service_id").notNull(),
  startDate: date("start_date").notNull(), endDate: date("end_date"), status: caseServiceStatusEnum("status").default("ACTIVE").notNull(),
  specialistId: uuid("specialist_id"), notes: text("notes"),
});

export const followUps = pgTable("follow_ups", {
  id: uuid("id").primaryKey().defaultRandom(), caseId: uuid("case_id").notNull(), specialistId: uuid("specialist_id").notNull(),
  caseServiceId: uuid("case_service_id"), followUpDate: date("follow_up_date").notNull(), progress: progressEnum("progress").notNull(),
  observations: text("observations"), recommendations: text("recommendations"), nextFollowUpDate: date("next_follow_up_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const medicalReports = pgTable("medical_reports", {
  id: uuid("id").primaryKey().defaultRandom(), caseId: uuid("case_id").notNull(), reportType: text("report_type").notNull(),
  reportDate: date("report_date").notNull(), issuedBy: text("issued_by"), description: text("description"), fileUrl: text("file_url"),
  uploadedBy: uuid("uploaded_by").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(), caseId: uuid("case_id").notNull(), fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), fileType: varchar("file_type", { length: 64 }).notNull(), fileSize: integer("file_size").notNull(),
  uploadedBy: uuid("uploaded_by").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(), caseId: uuid("case_id").notNull(), userId: uuid("user_id").notNull(), content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull(), title: text("title").notNull(), message: text("message").notNull(),
  type: notificationTypeEnum("type").default("INFO").notNull(), isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(), centerId: uuid("center_id"), userId: uuid("user_id"), action: text("action").notNull(),
  entityType: text("entity_type").notNull(), entityId: text("entity_id"), oldValues: jsonb("old_values"), newValues: jsonb("new_values"),
  ipAddress: text("ip_address"), userAgent: text("user_agent"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
