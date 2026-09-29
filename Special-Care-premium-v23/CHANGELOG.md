# Special Care — Update Log

## Foundation hardening

- Added PostgreSQL JSONB audit snapshots and indexes for audit, notifications, diagnoses, services, and attachments.
- Added unique attachment path constraint to prevent duplicate registrations.
- Added server-side specialist validation for case assignment and case services.
- Added stricter date validation for diagnoses and service periods.
- Added authenticated password change flow with current-password verification and audit events.
- Added administrator user editing with role changes constrained to non-super-admin roles.
- Added an admin-only audit log page with filters and pagination.
- Added report filters for gender, specialist, and age range and carried them into CSV exports.
- Added case-service editing to the case profile editor.
- Removed the client-side attachment registration step; Blob completion is now the source of truth.
- Hardened Blob pathname validation and made completion registration idempotent.
- Added a database check script and expanded the production checklist.


## UI/UX Refresh — 2026-09-29

- Added a shared premium Special Care brand mark/lockup.
- Refreshed the public navigation and footer branding.
- Reworked the landing page around the new premium green/cream/gold identity.
- Added stronger hero hierarchy, product-preview framing, trust strip, bento features, security section, and CTA.
- Added reduced-motion support and improved global selection/tap states.
- Refined the application shell branding and mobile navigation presentation.
- Removed the footer claim about "highest standards" encryption and replaced it with a factual privacy/access-control statement.


## Premium V4 — Dashboard & Case Profile
- Added dashboard quick actions for new cases, follow-ups, and reports.
- Added an operational pulse section to surface active, upcoming, and new cases.
- Upgraded case profile header with premium identity treatment and compact metrics.
- Added quick contact/location affordances to the case header.
- Improved responsive spacing and information hierarchy.

## V5 — Product hardening & UX polish

- Added granular `CASE_CREATE`, `CASE_STATUS`, and `AUDIT_VIEW` permission helpers and applied them to UI/server actions.
- Prevented users without case-status permission from setting non-active status during case creation/update.
- Corrected case creation UI to use create permission rather than edit permission.
- Corrected document upload UI to use document-upload permission.
- Added an accessible skip-to-content link and main content landmark.
- Added print-friendly global styles for report-oriented screens.
- Preserved center isolation and server-side authorization patterns.


## V6 — Security & data integrity hardening
- Enforced separate create/edit user permissions on server actions.
- Prevented disabling the last active center administrator.
- Enforced the dedicated case-status permission for status transitions.
- Added validation for follow-up and medical-report dates.
- Added cross-field case validation for diagnosis dates and service start dates.
- Restricted case services to active reference services.
- Improved case search to include the child's middle name.
- Replaced raw UUID-array SQL in case listing with typed Drizzle `inArray` queries.
- Added audit date filters and safer report age parsing.

## V7 — Integrity & Security Hardening
- Fixed case edit behavior so users without `CASE_STATUS` cannot accidentally reopen/close a case.
- Applied cross-field case timeline validation consistently to both create and update flows.
- Prevented case registration dates from being after existing follow-up dates.
- Replaced age-range date arithmetic with PostgreSQL age expressions for exact filtering.
- Serialized center admin role/status changes to prevent concurrent removal of the last active administrator.
- Prevented demoting the last active center administrator.
- Unified user-creation password validation at 10+ characters on server and client.
- Added CSV formula-injection protection for report exports.
- Updated user-management password guidance to match server validation.


## V9 — Parent + Multi-Center Architecture
- Added parent accounts and parent authentication.
- Added child ownership (`parent_children`).
- Added child-to-center memberships (`child_centers`).
- Added center directory profile fields and public center pages.
- Added parent portal and child creation flow.
- Added parent-driven center join flow.
- Center-specific case records can now originate from a parent join without a fake staff creator.

## V10 — Parent-to-Center workflow

- Added `child_profiles` for parent-owned health/context data shared across centers.
- Parent portal now captures diagnosis, disability type, severity and care summary when creating a child profile.
- Fixed parent dashboard to aggregate memberships across all children instead of only the first child.
- `joinCenter` is now transactional and creates the center case atomically with the membership.
- Existing global child profile diagnosis is copied into the center case when the required profile fields exist.
- Center dashboard now surfaces recent parent-initiated joins and active child memberships.
- Center case detail now shows the linked parent and global child profile.
- Super Admin now has a platform overview with global center/parent/child/case counts and recent case activity.
- Super Admin is routed to the platform overview instead of a center-scoped dashboard.
- Super Admin can open case details across centers.
- Center staff cannot mutate the parent-owned global child identity record through center case editing.
- Admin routes are protected by middleware in addition to server-side role checks.

## V11 — Parent Progress Portal
- Added a read-only child progress page for parents across all joined centers.
- Parents can review center memberships, follow-up development, services, and reports for their own child.
- Added direct child-profile links from the parent dashboard.
- Added a dedicated parent navigation shell.

## V13 — Center Case Activation Workflow
- Added center intake configuration workflow for assigning specialists and starting services from new parent joins.
- Added server-side validation and audit logging for intake configuration.
- Added dashboard attention indicators for active cases without an assigned specialist or first follow-up.
- Preserved center isolation and active membership checks.

## V14 — Treatment & Follow-up Workflow
- Added case-service lifecycle controls: Active, Paused, Completed, Cancelled.
- Preserved case-service IDs during case edits to keep follow-up links stable.
- Linked follow-ups to an optional active case service.
- Added server-side validation preventing follow-ups on closed/archived cases and invalid service links.
- Added audit logging for service lifecycle changes.
- Added service selection to follow-up creation.

## V15 — Intelligence & Progress Analytics

- Added `caseServiceId` to follow-ups so every follow-up can be attributed to a specific service.
- Added center-level progress analytics for improving/stable/declining/needs-review outcomes.
- Added service lifecycle analytics (active/completed/paused/cancelled).
- Added progress by service and specialist workload charts.
- Added a dashboard warning for active cases without a future follow-up date.
- Added database relation between follow-ups and case services.

## V16 — Platform Intelligence
- Expanded Super Admin platform overview with cross-center analytics.
- Added global progress distribution from follow-ups.
- Added platform-wide cases needing a future follow-up.
- Added center activity metrics: children, cases, and follow-ups.
- Added top active-center operational view.
- Kept all analytics read-only and restricted to SUPER_ADMIN.

## V17 — Final access & integrity pass
- Protected the Parent Portal through middleware routing.
- Restricted `/admin/*` to SUPER_ADMIN at the edge middleware layer.
- Prevented parent and center accounts from sharing the same email address.
- Made parent child-profile creation atomic in a database transaction.
- Kept the existing multi-center, analytics, audit, and workflow architecture intact.

## V18 — End-to-End QA & Access Hardening

- Restricted center creation to `SUPER_ADMIN` at the server-action boundary.
- Removed `CENTER_MANAGE` from the normal `CENTER_ADMIN` role.
- Added `/intake` to protected routing and blocked Parent/Super Admin access to the center intake workflow.
- Updated login routing so Super Admin lands on the platform dashboard.
- Tightened Parent routing away from center/admin application routes.
- Kept platform, parent, and center navigation boundaries aligned between middleware and server-side checks.

## v19.0.0 — Final UX/Product Polish
- Fixed missing `UserPlus` icon import in the main app shell.
- Made the top bar context-aware for Parent and Super Admin accounts; removed misleading parent links to center-only pages.
- Added a reusable Server Action `SubmitButton` with native pending-state feedback.
- Added pending feedback to parent child-profile creation.
- Refreshed the public center directory with responsive cards, empty state, contact details, active badges, and stronger mobile presentation.
- Added mobile input sizing and small-screen focus/scroll polish.

## V21 — Production Readiness Pass

- Fixed the Super Admin centers management page guard so `/admin/centers` is explicitly limited to `SUPER_ADMIN` instead of relying only on the generic `CENTER_MANAGE` permission.
- Kept the create-center Server Action protected by both `SUPER_ADMIN` role and `CENTER_MANAGE` permission.
- Rechecked the platform admin route boundaries and health endpoint as part of the release-readiness pass.
- `npm install` could not complete in the current environment because the npm registry request timed out; run dependency installation and the full typecheck/lint/build suite in the project environment before deployment.

## V22 — Production Hardening
- Added server environment validation for DATABASE_URL and NEXTAUTH_SECRET.
- Strengthened production HTTPS expectations for NEXTAUTH_URL.
- Upgraded health endpoint to readiness checks for environment + database with no-store caching.
- Added production security headers and disabled Next.js powered-by header.
- Serialized cross-account email checks to prevent Parent/Center account creation races.
- Serialized center slug creation to prevent duplicate-center races.
- Center user creation now checks parent accounts atomically.

## V23 — Final Release QA & Data Integrity
- Fixed Parent Child Profile report mapping to use `reportType` from the database schema.
- Enforced `child_centers` membership whenever a center creates a case directly, including safe reactivation of an existing membership.
- Stopped deleting historical case-service rows during case edits; removed services are now preserved and marked `CANCELLED` so follow-up history remains intact.
- Kept multi-center relationships authoritative for both Parent Portal joins and center-created cases.


## V23 — Final Release QA & Data Integrity
- Fixed Parent Child Profile report mapping to use `reportType` from the database schema.
- Enforced `child_centers` membership whenever a center creates a case directly, including safe reactivation of an existing membership.
- Stopped deleting historical case-service rows during case edits; removed services are now preserved and marked `CANCELLED` so follow-up history remains intact.
- Kept multi-center relationships authoritative for both Parent Portal joins and center-created cases.
