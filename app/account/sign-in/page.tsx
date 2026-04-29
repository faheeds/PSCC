import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ClubLogo } from "@/components/club-logo";
import { env } from "@/lib/env";

export default function MemberSignInPage() {
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo + title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative w-14 h-14">
              <ClubLogo className="w-14 h-14" priority />
            </div>
          </div>
          <div>
            <p className="text-forest-400 text-xs font-semibold uppercase tracking-widest mb-1">Member Portal</p>
            <h1 className="text-navy-100 text-2xl font-display font-semibold">Welcome back</h1>
            <p className="text-navy-400 text-sm mt-1">Sign in to access your PSCC account</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-navy-800 border border-white/5 rounded-2xl p-6 space-y-4 shadow-soft">
          {googleEnabled ? (
            <>
              <GoogleSignInButton callbackUrl="/account" portal="member" />
              <p className="text-center text-navy-600 text-xs pt-1">
                First time? Your account will be created automatically.
              </p>
            </>
          ) : (
            <div className="bg-amber-900/20 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl text-sm">
              Google sign-in is not configured. Contact the administrator.
            </div>
          )}
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 text-xs text-navy-600">
          <a href="/" className="hover:text-navy-300 transition no-underline">← Home</a>
          <span>·</span>
          <a href="/about" className="hover:text-navy-300 transition no-underline">About PSCC</a>
          <span>·</span>
          <a href="/contact" className="hover:text-navy-300 transition no-underline">Contact</a>
        </div>

      </div>
    </main>
  );
}
