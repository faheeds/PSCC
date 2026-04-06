import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { PageShell } from "@/components/ui";
import { ClubLogo } from "@/components/club-logo";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-paper/85 backdrop-blur">
      <PageShell className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3 text-ink no-underline">
          <ClubLogo className="h-12 w-12 sm:h-14 sm:w-14" priority />
          <div>
            <p className="font-display text-lg leading-none sm:text-xl">Puget Sound Cricket Club</p>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-700">Members and Admin Portal</p>
          </div>
        </Link>

        <nav className="flex w-full items-center gap-2 text-sm font-medium sm:w-auto sm:justify-end sm:gap-3">
          <Link href="/account" className="flex-1 rounded-full bg-white px-4 py-2 text-center text-ink no-underline hover:bg-brand-50 sm:flex-none">
            Member Portal
          </Link>
          <Link href="/admin/dashboard" className="rounded-full px-4 py-2 text-slate-600 no-underline hover:bg-white hover:text-ink">
            Admin Portal
          </Link>
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-ink">
                Sign out
              </button>
            </form>
          ) : null}
        </nav>
      </PageShell>
    </header>
  );
}
