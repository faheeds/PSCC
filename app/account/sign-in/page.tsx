import { Card, PageShell, SectionTitle } from "@/components/ui";
import { CredentialsSignInForm } from "@/components/auth/credentials-sign-in-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { env } from "@/lib/env";

export default function MemberSignInPage() {
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="min-h-screen">
      <PageShell className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md space-y-6">
          <SectionTitle
            eyebrow="Member Sign In"
            title="View your balance and pay online"
            description="Use Google to create your member account the first time you sign in, or use your existing email and password."
          />
          {googleEnabled ? (
            <>
              <GoogleSignInButton callbackUrl="/account" portal="member" />
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Google sign-in is ready in the code, but it will not appear until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
              are added to the app environment.
            </div>
          )}
          <CredentialsSignInForm provider="member-credentials" redirectTo="/account" submitLabel="Sign in to member portal" />
        </Card>
      </PageShell>
    </main>
  );
}
