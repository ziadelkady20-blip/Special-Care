import "server-only";

const required = ["DATABASE_URL", "NEXTAUTH_SECRET"] as const;

export function getEnvStatus() {
  const missing = required.filter((key) => !process.env[key]?.trim());
  const secretLength = process.env.NEXTAUTH_SECRET?.length ?? 0;
  const issues: string[] = [...missing];
  if (process.env.NEXTAUTH_SECRET && secretLength < 32) issues.push("NEXTAUTH_SECRET must be at least 32 characters");
  if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_URL?.startsWith("https://")) issues.push("NEXTAUTH_URL must use HTTPS in production");
  return { ok: issues.length === 0, issues };
}

export function assertServerEnv() {
  const status = getEnvStatus();
  if (!status.ok) throw new Error(`Invalid environment configuration: ${status.issues.join("; ")}`);
}
