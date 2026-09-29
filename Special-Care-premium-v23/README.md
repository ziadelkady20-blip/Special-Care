# Special Care

Smart Case Management Platform for special-care centers.

## Stack

- Next.js 16.3.6 + TypeScript
- PostgreSQL + Drizzle ORM
- NextAuth credentials authentication
- Tailwind CSS
- React Hook Form + Zod
- Recharts
- Vercel Blob private storage for sensitive documents

## Environment

Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- Vercel Blob access through `BLOB_READ_WRITE_TOKEN` or Vercel OIDC when deployed on Vercel

Never commit `.env.local`.

## Database

After setting `DATABASE_URL`:

```bash
npm install
npm run db:push
```

For a migration-based workflow:

```bash
npm run db:generate
npm run db:migrate
```

## Development

```bash
npm run dev
```

The development seed data uses the demo account shown on the login page only in development mode.

## Security and data controls

- Center isolation is enforced on server-side case, user, report, and document queries.
- Role-based permissions cover cases, follow-ups, reports, exports, users, documents, and audit logs.
- Sensitive document storage uses private Vercel Blob access.
- Audit logs use PostgreSQL JSONB for before/after values.
- Users can change their own password after verifying the current password.
- Administrators can review the center activity log and edit team member roles.
- Case numbers are allocated inside a PostgreSQL transaction with an advisory lock to avoid collisions under concurrent requests.

## Production checklist

1. Set a strong `NEXTAUTH_SECRET`.
2. Use a production PostgreSQL database.
3. Create a **private** Vercel Blob store for case documents.
4. Run the database schema push/migrations before first deployment.
5. Run `npm run db:check` before migration/deployment.
6. Verify role permissions and center isolation.
7. Verify document access through the authenticated attachment route.
8. Configure a private Blob store and `BLOB_READ_WRITE_TOKEN` where required.
9. Run typecheck/lint/build in CI before deployment.

### V7 hardening notes
- Case status is preserved during edits unless the actor explicitly has `CASE_STATUS`.
- Case timeline validation is applied consistently to create/update operations.
- User administrator changes are serialized per center.
- CSV exports escape formula-leading values.
- User password creation requires at least 10 characters in both UI and server validation.


## V9 — Parent + Multi-Center Architecture
- Added parent accounts and parent authentication.
- Added child ownership (`parent_children`).
- Added child-to-center memberships (`child_centers`).
- Added center directory profile fields and public center pages.
- Added parent portal and child creation flow.
- Added parent-driven center join flow.
- Center-specific case records can now originate from a parent join without a fake staff creator.

## V10 architecture note

Special Care is now modeled as a parent-first, multi-center platform:

`Parent -> Child -> ChildCenter -> Center`

The child has a global parent-owned profile, while each center keeps its own case, services, follow-ups, reports and notes. A parent joining a center creates the membership and the center case in one transaction.

### Database migration

V10 adds `child_profiles`. Run the normal Drizzle migration flow against a backed-up database:

```bash
npm run db:generate
npm run db:migrate
```

### V15 Analytics

The Reports area now includes operational progress intelligence: overall progress distribution, service lifecycle status, progress by service, specialist follow-up workload, and active cases that need a future follow-up scheduled.


### V18 QA notes
- Super Admin is the only role allowed to create platform centers.
- Parent routes are isolated from center operations.
- Center intake is isolated from the Parent portal and Super Admin uses the platform dashboard instead.

### Production readiness
- `/api/health` now returns readiness status for environment and database connectivity.
- Production requires `NEXTAUTH_SECRET` of at least 32 characters and an HTTPS `NEXTAUTH_URL`.
- Account creation uses PostgreSQL advisory locks around cross-account email checks to prevent race conditions.
