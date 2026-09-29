declare module "@/app/actions" {
  export function updateCaseServiceStatus(
    caseServiceId: string,
    status: "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED",
  ): Promise<{ ok: boolean; error?: string }>;
}
