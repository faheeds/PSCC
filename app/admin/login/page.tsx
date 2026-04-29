import { CredentialsSignInForm } from "@/components/auth/credentials-sign-in-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ClubLogo } from "@/components/club-logo";
import { env } from "@/lib/env";

const errorMessages: Record<string, string> = {
  GoogleAdminNotAllowlisted:
    "That Google account is not on the admin allowlist. Add the email to ADMIN_ALLOWED_EMAILS before using it for admin access.",
  GoogleAdminSessionFailed: "We could not finish the Google admin sign-in. Please try again.",
};

export default async function AdminSignInPage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const errorMessage = searchParams.error ? errorMessages[searchParams.error] : null;

  return (
    <main className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      {/* Background rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border border-white/5"/>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full border border-forest-600/10"/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/3"/>
      </div>

      <div className="relative w-full max-w-md space-y-6">

        {/* Logo + branding */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative w-16 h-16">
              <ClubLogo className="w-16 h-16" priority />
            </div>
          </div>
          <div>
            <p className="text-forest-400 text-xs font-semibold uppercase tracking-widest mb-1">Admin Portal</p>
            <h1 className="text-navy-100 text-2xl font-display font-semibold">Club Operations</h1>
            <p className="text-navy-400 text-sm mt-1">Sign in to manage PSCC</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-navy-800 border border-white/5 rounded-2xl p-6 space-y-5 shadow-soft">

          {errorMessage && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
              {errorMessage}
            </div>
          )}

          {googleEnabled && (
            <>
              <GoogleSignInButton callbackUrl="/admin/auth/complete" portal="admin" />
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10"/>
                <span className="text-navy-500 text-xs uppercase tracking-widest">or</span>
                <span className="h-px flex-1 bg-white/10"/>
              </div>
            </>
          )}

          <CredentialsSignInForm
            provider="admin-credentials"
            redirectTo="/admin/dashboard"
            submitLabel="Sign in to admin"
          />
        </div>

        {/* Footer */}
        <p className="text-center text-navy-600 text-xs">
          Not an admin?{" "}
          <a href="/" className="text-navy-400 hover:text-navy-200 transition no-underline">
            Return to site →
          </a>
        </p>

      </div>
    </main>
  );
}
