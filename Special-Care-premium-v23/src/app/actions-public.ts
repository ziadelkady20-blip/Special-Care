"use server";

// Public, statically-typed facade for the application's server actions.
// Re-export the real actions instead of dynamically importing them so both
// TypeScript and Next.js can statically discover the named exports.
export {
  createCase,
  updateCase,
  createFollowUp,
  updateCaseServiceStatus,
  updateCaseStatus,
  addNote,
  createMedicalReport,
  changeOwnPassword,
  createUser,
  updateUser,
  toggleUserStatus,
  markNotificationRead,
  createCenter,
  registerParent,
  createParentChild,
  joinCenter,
} from "./actions";
