import { env } from "@/lib/env";

export const allowedAdminEmails = new Set(
  (env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

export function isAllowedAdminEmail(email?: string | null) {
  return Boolean(email && allowedAdminEmails.has(email.trim().toLowerCase()));
}
