import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";
import { Card, PageShell } from "@/components/ui";

const memberActions = [
  {
    eyebrow: "1",
    title: "Practice check-in",
    body: "Check in when you reach the ground and claim your batting order spot.",
    href: "/account",
    label: "Open check-in"
  },
  {
    eyebrow: "2",
    title: "Check and pay dues",
    body: "See your balance, payment history, and pay what you owe.",
    href: "/account",
    label: "Open dues"
  },
  {
    eyebrow: "3",
    title: "Share game pictures and videos",
    body: "Send your best moments to the club social media queue.",
    href: "/account",
    label: "Upload media"
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <PageShell className="space-y-6 pb-14 pt-6 sm:space-y-8 sm:pt-8">
        <section className="overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/85 shadow-soft backdrop-blur">
          <div className="grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10 lg:py-10">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Member Portal</p>
              <div className="space-y-3">
                <h1 className="font-display text-4xl leading-none text-ink sm:text-5xl">Three things. Fast.</h1>
                <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  Check in for practice, pay dues, and share match photos in one simple member experience.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/account"
                  className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-slate-800"
                >
                  Open member portal
                </Link>
                <Link
                  href="/account/sign-in"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-ink no-underline hover:border-brand-300"
                >
                  Sign in
                </Link>
              </div>

              <div className="rounded-[1.75rem] border border-brand-100 bg-brand-50/80 px-4 py-4 text-sm text-brand-900">
                Weekly practice is every Wednesday, 4:30 PM to 8:30 PM.
              </div>
            </div>

            <Card className="border-0 bg-gradient-to-br from-brand-50 via-white to-sand-50 p-5 sm:p-6">
              <div className="mx-auto flex max-w-[16rem] justify-center sm:max-w-[18rem]">
                <ClubLogo className="aspect-[0.86] w-full" priority />
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 sm:gap-5 lg:grid-cols-3">
          {memberActions.map((action) => (
            <Card key={action.title} className="space-y-4 bg-white/92">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">{action.eyebrow}</p>
              <div className="space-y-2">
                <h2 className="font-display text-2xl text-ink">{action.title}</h2>
                <p className="text-sm leading-6 text-slate-600">{action.body}</p>
              </div>
              <Link href={action.href} className="inline-flex text-sm font-semibold text-brand-700 no-underline hover:text-brand-600">
                {action.label}
              </Link>
            </Card>
          ))}
        </section>

        <section className="flex justify-center pt-1">
          <div className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
            Admin access
            {" • "}
            <Link href="/admin/dashboard" className="font-semibold text-ink no-underline hover:text-brand-700">
              Open dashboard
            </Link>
          </div>
        </section>
      </PageShell>
    </main>
  );
}
