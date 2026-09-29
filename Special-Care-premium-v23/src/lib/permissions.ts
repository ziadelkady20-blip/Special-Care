// Client-safe roles and granular permissions. Keep this file free of DB imports.
export type AppRole =
  | "SUPER_ADMIN"
  | "CENTER_ADMIN"
  | "SPECIALIST"
  | "DATA_ENTRY"
  | "VIEWER"
  | "PARENT";

export type AppPermission =
  | "CASE_VIEW"
  | "CASE_CREATE"
  | "CASE_EDIT"
  | "CASE_STATUS"
  | "FOLLOWUP_VIEW"
  | "FOLLOWUP_CREATE"
  | "FOLLOWUP_EDIT"
  | "REPORT_VIEW"
  | "REPORT_EXPORT"
  | "USER_VIEW"
  | "USER_CREATE"
  | "USER_EDIT"
  | "DOCUMENT_VIEW"
  | "DOCUMENT_UPLOAD"
  | "DOCUMENT_DELETE"
  | "AUDIT_VIEW"
  | "CENTER_MANAGE";

const ROLE_PERMISSIONS: Record<AppRole, readonly AppPermission[]> = {
  PARENT: [],
  SUPER_ADMIN: [
    "CASE_VIEW", "CASE_CREATE", "CASE_EDIT", "CASE_STATUS",
    "FOLLOWUP_VIEW", "FOLLOWUP_CREATE", "FOLLOWUP_EDIT",
    "REPORT_VIEW", "REPORT_EXPORT",
    "USER_VIEW", "USER_CREATE", "USER_EDIT",
    "DOCUMENT_VIEW", "DOCUMENT_UPLOAD", "DOCUMENT_DELETE", "AUDIT_VIEW", "CENTER_MANAGE",
  ],
  CENTER_ADMIN: [
    "CASE_VIEW", "CASE_CREATE", "CASE_EDIT", "CASE_STATUS",
    "FOLLOWUP_VIEW", "FOLLOWUP_CREATE", "FOLLOWUP_EDIT",
    "REPORT_VIEW", "REPORT_EXPORT",
    "USER_VIEW", "USER_CREATE", "USER_EDIT",
    "DOCUMENT_VIEW", "DOCUMENT_UPLOAD", "DOCUMENT_DELETE", "AUDIT_VIEW",
  ],
  SPECIALIST: [
    "CASE_VIEW", "CASE_CREATE", "CASE_EDIT", "CASE_STATUS",
    "FOLLOWUP_VIEW", "FOLLOWUP_CREATE", "FOLLOWUP_EDIT",
    "REPORT_VIEW", "REPORT_EXPORT",
    "DOCUMENT_VIEW", "DOCUMENT_UPLOAD",
  ],
  DATA_ENTRY: [
    "CASE_VIEW", "CASE_CREATE", "CASE_EDIT",
    "FOLLOWUP_VIEW",
    "DOCUMENT_VIEW", "DOCUMENT_UPLOAD",
  ],
  VIEWER: [
    "CASE_VIEW",
    "FOLLOWUP_VIEW",
    "REPORT_VIEW",
    "DOCUMENT_VIEW",
  ],
};

export function hasPermission(role: AppRole, permission: AppPermission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageCenters(role: AppRole) { return hasPermission(role, "CENTER_MANAGE"); }

export function canCreateCases(role: AppRole) {
  return hasPermission(role, "CASE_CREATE");
}
export function canChangeCaseStatus(role: AppRole) {
  return hasPermission(role, "CASE_STATUS");
}
export function canViewAudit(role: AppRole) {
  return hasPermission(role, "AUDIT_VIEW");
}
export function canCreateUsers(role: AppRole) {
  return hasPermission(role, "USER_CREATE");
}

export function canEditUsers(role: AppRole) {
  return hasPermission(role, "USER_EDIT");
}

export function canManageUsers(role: AppRole) {
  return canEditUsers(role) || canCreateUsers(role);
}
export function canEditCases(role: AppRole) {
  return hasPermission(role, "CASE_EDIT");
}
export function canAddFollowUps(role: AppRole) {
  return hasPermission(role, "FOLLOWUP_CREATE");
}
export function canExport(role: AppRole) {
  return hasPermission(role, "REPORT_EXPORT");
}
export function canViewReports(role: AppRole) {
  return hasPermission(role, "REPORT_VIEW");
}
export function canUploadDocuments(role: AppRole) {
  return hasPermission(role, "DOCUMENT_UPLOAD");
}
export function canDeleteDocuments(role: AppRole) {
  return hasPermission(role, "DOCUMENT_DELETE");
}

export const roleLabels: Record<AppRole, string> = {
  PARENT: "ولي أمر",
  SUPER_ADMIN: "مدير عام",
  CENTER_ADMIN: "مدير مركز",
  SPECIALIST: "أخصائي",
  DATA_ENTRY: "إدخال بيانات",
  VIEWER: "مشاهد",
};
