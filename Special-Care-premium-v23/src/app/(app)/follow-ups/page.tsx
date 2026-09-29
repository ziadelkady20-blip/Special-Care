import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { followUps, cases, children, users } from "@/db/schema";
import { eq, desc, and, gte, asc } from "drizzle-orm";
import { Card, Badge, PageHeader, EmptyState } from "@/components/ui";
import { formatDate, statusLabels, progressColor } from "@/lib/utils";
import { CalendarCheck, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const session = await requireSession();

  // Upcoming + recent follow-ups for this center
  const rows = await db
    .select({
      id: followUps.id,
      caseId: followUps.caseId,
      followUpDate: followUps.followUpDate,
      progress: followUps.progress,
      observations: followUps.observations,
      recommendations: followUps.recommendations,
      nextFollowUpDate: followUps.nextFollowUpDate,
      caseNumber: cases.caseNumber,
      firstName: children.firstName,
      lastName: children.lastName,
      specialistName: users.name,
    })
    .from(followUps)
    .innerJoin(cases, eq(followUps.caseId, cases.id))
    .innerJoin(children, eq(cases.childId, children.id))
    .leftJoin(users, eq(followUps.specialistId, users.id))
    .where(eq(cases.centerId, session.user.centerId))
    .orderBy(desc(followUps.followUpDate))
    .limit(50);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows.filter((r) => (r.followUpDate ?? "") >= today);
  const past = rows.filter((r) => (r.followUpDate ?? "") < today);

  return (
    <>
      <PageHeader
        title="المتابعات"
        subtitle="جميع المتابعات المسجلة للحالات في المركز."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <p className="text-sm text-muted">إجمالي المتابعات</p>
          <p className="text-3xl font-bold text-ink mt-1 tabular-nums">{rows.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">متابعات قادمة</p>
          <p className="text-3xl font-bold text-success mt-1 tabular-nums">{upcoming.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">متابعات سابقة</p>
          <p className="text-3xl font-bold text-muted mt-1 tabular-nums">{past.length}</p>
        </Card>
      </div>

      <Card>
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-ink">جميع المتابعات</h2>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="لا توجد متابعات" />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/cases/${r.caseId}`} className="flex items-start gap-4 p-5 hover:bg-background transition-colors">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-ink">
                        {r.firstName} {r.lastName}
                      </p>
                      <span className="text-xs font-mono text-muted">{r.caseNumber}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${progressColor[r.progress]}`}>
                        {statusLabels[r.progress]}
                      </span>
                    </div>
                    {r.observations ? (
                      <p className="text-sm text-muted mt-1 line-clamp-2">{r.observations}</p>
                    ) : null}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarCheck className="h-3 w-3" />
                        {formatDate(r.followUpDate)}
                      </span>
                      {r.specialistName ? (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {r.specialistName}
                        </span>
                      ) : null}
                      {r.nextFollowUpDate ? (
                        <span>القادمة: {formatDate(r.nextFollowUpDate)}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
