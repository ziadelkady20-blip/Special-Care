import { requireSession } from "@/lib/session";
import { getReferenceData } from "@/lib/queries";
import { canCreateCases } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CaseWizard } from "./case-wizard";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const session = await requireSession();
  if (!canCreateCases(session.user.role)) {
    redirect("/cases?error=forbidden");
  }
  const ref = await getReferenceData(session.user.centerId);

  return (
    <div>
      <CaseWizard
        specialists={ref.specialists}
        disabilities={ref.disabilities}
        services={ref.services}
        userName={session.user.name}
        userId={session.user.id}
      />
    </div>
  );
}
