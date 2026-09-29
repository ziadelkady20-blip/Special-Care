"use server";

// Stable facade for client/server components. The implementation lives in
// actions.ts; using a dynamic import here avoids brittle named-export
// resolution while keeping the public action signatures explicit.
async function loadActions(): Promise<Record<string, any>> {
  return (await import("./actions")) as unknown as Record<string, any>;
}

export async function createCase(formData: unknown) { return (await loadActions()).createCase(formData); }
export async function updateCase(formData: unknown) { return (await loadActions()).updateCase(formData); }
export async function createFollowUp(formData: unknown) { return (await loadActions()).createFollowUp(formData); }
export async function updateCaseServiceStatus(caseServiceId: string, status: "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED") { return (await loadActions()).updateCaseServiceStatus(caseServiceId, status); }
export async function updateCaseStatus(caseId: string, status: "ACTIVE" | "ON_HOLD" | "CLOSED" | "ARCHIVED") { return (await loadActions()).updateCaseStatus(caseId, status); }
export async function addNote(caseId: string, content: string) { return (await loadActions()).addNote(caseId, content); }
export async function createMedicalReport(caseId: string, formData: FormData) { return (await loadActions()).createMedicalReport(caseId, formData); }
export async function changeOwnPassword(formData: unknown) { return (await loadActions()).changeOwnPassword(formData); }
export async function createUser(formData: unknown) { return (await loadActions()).createUser(formData); }
export async function updateUser(formData: unknown) { return (await loadActions()).updateUser(formData); }
export async function toggleUserStatus(userId: string) { return (await loadActions()).toggleUserStatus(userId); }
export async function markNotificationRead(id: string) { return (await loadActions()).markNotificationRead(id); }
export async function createCenter(formData: FormData) { return (await loadActions()).createCenter(formData); }
export async function registerParent(formData: FormData) { return (await loadActions()).registerParent(formData); }
export async function createParentChild(formData: FormData) { return (await loadActions()).createParentChild(formData); }
export async function joinCenter(formData: FormData) { return (await loadActions()).joinCenter(formData); }
