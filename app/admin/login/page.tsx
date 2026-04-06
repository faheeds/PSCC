import { Card, PageShell, SectionTitle } from "@/components/ui";
import { CredentialsSignInForm } from "@/components/auth/credentials-sign-in-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { env } from "@/lib/env";

const errorMessages: Record<string, string> = {
  GoogleAdminNotAllowlisted:
    "That Google account is signed in as a member, but it is not on the admin allowlist yet. Add the email to ADMIN_ALLOWED_EMAILS before using it for admin access.",
  GoogleAdminSessionFailed: "We could not finish the Google admin sign-in. Please try again."
};

export default async function AdminSignInPage(props: {
  searchParams?: Promise<{
    error?: string;
  }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const errorMessage = searchParams.error ? errorMessages[searchParams.error] : null;

  return (
    <main className="min-h-screen">
      <PageShell className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md space-y-6">
          <SectionTitle
            eyebrow="Admin Sign In"
            title="Treasurer dashboard access"
            description="Admins can sign in with an allowlisted Google account or use the existing treasurer email and password."
          />
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{errorMessage}</div>
          ) : null}
          {googleEnabled ? (
            <>
              <GoogleSignInButton callbackUrl="/admin/auth/complete" portal="admin" />
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          ) : null}
          <CredentialsSignInForm provider="admin-credentials" redirectTo="/admin/dashboard" submitLabel="Sign in to admin" />
        </Card>
      </PageShell>
    </main>
  );
}
