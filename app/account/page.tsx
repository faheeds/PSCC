import { LedgerCategory, MemberMediaStatus, MemberMediaType } from "@prisma/client";
import { Badge, Card, PageShell, SectionTitle, StatCard } from "@/components/ui";
import { MemberMediaUploadForm } from "@/components/account/member-media-upload-form";
import { PayBalanceButton } from "@/components/account/pay-balance-button";
import { PracticeCheckInPanel } from "@/components/account/practice-check-in-panel";
import { getBalanceTone } from "@/lib/ledger";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/member-auth";
import { isPracticeCheckInOpen, getPracticeCheckInOpenTime } from "@/lib/practice-checkins";
import { WEEKLY_PRACTICE_CANCELLATION_MESSAGE, ensureWeeklyPracticeSessions } from "@/lib/weekly-practices";
import { formatCurrency, formatDate, formatDateTime, formatDurationSeconds, formatFileSize } from "@/lib/utils";

export default async function MemberAccountPage() {
  await ensureWeeklyPracticeSessions({ pastWeeks: 0, futureWeeks: 2 });
  const session = await requireMember();
  const memberId = session.user?.memberId;
  const now = new Date();
  const practiceWindowEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [member, ledgerEntries, paymentEntries, participations, participationCount, categoryTotals, mediaSubmissions, nearbyPractices] = await Promise.all([
    prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        jerseySize: true,
        status: true,
        memberSince: true
      }
    }),
    prisma.ledgerEntry.findMany({
      where: { memberId },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 25
    }),
    prisma.ledgerEntry.findMany({
      where: {
        memberId,
        category: LedgerCategory.PAYMENT
      },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 10
    }),
    prisma.gameParticipation.findMany({
      where: { memberId },
      include: {
        game: {
          include: {
            gameType: true
          }
        }
      },
      orderBy: {
        game: {
          gameDate: "desc"
        }
      },
      take: 10
    }),
    prisma.gameParticipation.count({
      where: { memberId }
    }),
    prisma.ledgerEntry.groupBy({
      by: ["category"],
      where: { memberId },
      _sum: {
        amountCents: true
      }
    }),
    prisma.memberMediaSubmission.findMany({
      where: { memberId },
      orderBy: [{ createdAt: "desc" }],
      take: 8
    }),
    prisma.practiceSession.findMany({
      where: {
        recurrenceKey: {
          not: null
        },
        endsAt: {
          gte: now
        },
        startsAt: {
          lte: practiceWindowEnd
        }
      },
      include: {
        checkIns: {
          where: { memberId },
          select: {
            arrivalOrder: true,
            checkedInAt: true,
            distanceMeters: true
          }
        },
        _count: {
          select: {
            checkIns: true
          }
        }
      },
      orderBy: [{ startsAt: "asc" }],
      take: 1
    })
  ]);

  if (!member) {
    return null;
  }

  const totalsByCategory = Object.fromEntries(categoryTotals.map((item) => [item.category, item._sum.amountCents ?? 0])) as Record<LedgerCategory, number>;
  const balanceCents = categoryTotals.reduce((sum, item) => sum + (item._sum.amountCents ?? 0), 0);
  const paymentsTotal = Math.abs(totalsByCategory.PAYMENT ?? 0);
  const balanceTone = getBalanceTone(balanceCents);
  const balanceBreakdown = [
    { label: "Club fees", amountCents: totalsByCategory.CLUB_FEE ?? 0 },
    { label: "Game fees", amountCents: totalsByCategory.GAME_FEE ?? 0 },
    { label: "Uniforms", amountCents: totalsByCategory.UNIFORM ?? 0 },
    { label: "Adjustments", amountCents: totalsByCategory.ADJUSTMENT ?? 0 },
    { label: "Payments received", amountCents: totalsByCategory.PAYMENT ?? 0 },
    { label: "Credits", amountCents: totalsByCategory.CREDIT ?? 0 }
  ].filter((item) => item.amountCents !== 0);
  const submittedMediaCount = mediaSubmissions.length;
  const pendingMediaCount = mediaSubmissions.filter((item) => item.status === MemberMediaStatus.SUBMITTED).length;
  const practiceCheckInItems = nearbyPractices.map((practice) => ({
    id: practice.id,
    title: practice.title,
    location: practice.location,
    startsAt: practice.startsAt.toISOString(),
    endsAt: practice.endsAt.toISOString(),
    status: practice.status,
    cancellationReason: practice.cancellationReason ?? WEEKLY_PRACTICE_CANCELLATION_MESSAGE,
    focusArea: practice.focusArea,
    checkInConfigured: practice.checkInLatitude !== null && practice.checkInLongitude !== null,
    checkInRadiusMeters: practice.checkInRadiusMeters,
    checkInOpen: isPracticeCheckInOpen(practice, now),
    checkInOpensAt: getPracticeCheckInOpenTime(practice.startsAt).toISOString(),
    checkedInMemberCount: practice._count.checkIns,
    memberCheckIn: practice.checkIns[0]
      ? {
          arrivalOrder: practice.checkIns[0].arrivalOrder,
          checkedInAt: practice.checkIns[0].checkedInAt.toISOString(),
          distanceMeters: practice.checkIns[0].distanceMeters
        }
      : null
  }));

  return (
    <main className="min-h-screen">
      <PageShell className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionTitle
            eyebrow="Member Portal"
            title={`Welcome, ${member.name}`}
            description="Review your club charges, recent games, and online payments in one place."
          />
          <Badge>{member.status}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Current balance"
            value={formatCurrency(balanceCents)}
            tone={balanceTone === "due" ? "warning" : "success"}
            href="#balance-breakdown"
          />
          <StatCard label="Games recorded" value={String(participationCount)} href="#recent-games" />
          <StatCard label="Payments received" value={formatCurrency(paymentsTotal)} tone="success" href="#payment-history" />
        </div>

        <PayBalanceButton balanceCents={balanceCents} />

        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-2xl text-ink">Practice check-in</h2>
            <p className="text-sm text-slate-600">
              When you arrive at the ground, tap check in to claim your spot in the batting order list. The app will only allow it when you are within the
              saved practice radius.
            </p>
          </div>
          <PracticeCheckInPanel practices={practiceCheckInItems} />
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card id="balance-breakdown" className="scroll-mt-28 space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-2xl text-ink">Balance breakdown</h2>
              <p className="text-sm text-slate-600">This is the simple summary of what makes up your current balance.</p>
            </div>
            <div className="space-y-3">
              {balanceBreakdown.length ? (
                balanceBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className={`text-sm font-semibold ${item.amountCents > 0 ? "text-amber-700" : "text-brand-700"}`}>
                      {item.amountCents > 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(item.amountCents))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No charges or payments have been posted yet.</p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
              <p className="font-semibold text-ink">Current balance</p>
              <p className={`text-lg font-semibold ${balanceCents > 0 ? "text-amber-700" : "text-brand-700"}`}>{formatCurrency(balanceCents)}</p>
            </div>
          </Card>

          <Card id="payment-history" className="scroll-mt-28 space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-2xl text-ink">Payment history</h2>
              <p className="text-sm text-slate-600">Every confirmed payment appears here with its amount and date.</p>
            </div>
            <div className="space-y-3">
              {paymentEntries.length ? (
                paymentEntries.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{entry.description}</p>
                      <p className="text-sm text-slate-500">
                        Payment | {formatDateTime(entry.occurredAt)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-brand-700">-{formatCurrency(Math.abs(entry.amountCents))}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No confirmed payments have been posted to your account yet.</p>
              )}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-display text-2xl text-ink">Balance activity</h2>
            <div className="space-y-3">
              {ledgerEntries.length ? (
                ledgerEntries.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{entry.description}</p>
                      <p className="text-sm text-slate-500">
                        {entry.category.replaceAll("_", " ")} | {formatDateTime(entry.occurredAt)}
                      </p>
                    </div>
                    <p className={`text-sm font-semibold ${entry.amountCents > 0 ? "text-amber-700" : "text-brand-700"}`}>
                      {entry.amountCents > 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(entry.amountCents))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No ledger activity yet.</p>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-2xl text-ink">Share photos and short videos</h2>
                <p className="text-sm text-slate-600">
                  Send pictures and clips from games, practices, and events straight to the club social media review queue.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-medium text-slate-600">Your uploads in this portal</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">{submittedMediaCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-medium text-slate-600">Waiting for review</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">{pendingMediaCount}</p>
                </div>
              </div>
              <MemberMediaUploadForm />
            </Card>

            <Card className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-2xl text-ink">Your shared media</h2>
                <p className="text-sm text-slate-600">Track what you have already sent to the social media team.</p>
              </div>
              <div className="space-y-3">
                {mediaSubmissions.length ? (
                  mediaSubmissions.map((submission) => (
                    <div key={submission.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-ink">{submission.title}</p>
                          <p className="text-sm text-slate-500">
                            {submission.mediaType === MemberMediaType.VIDEO ? "Video" : "Photo"}
                            {submission.eventTitle ? ` | ${submission.eventTitle}` : ""}
                            {` | ${formatDateTime(submission.createdAt)}`}
                          </p>
                        </div>
                        <Badge className={memberMediaBadgeClassName(submission.status)}>{formatMemberMediaStatus(submission.status)}</Badge>
                      </div>
                      {submission.caption ? <p className="mt-3 text-sm text-slate-700">{submission.caption}</p> : null}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span>{formatFileSize(submission.sizeBytes)}</span>
                        {submission.durationSeconds ? <span>{formatDurationSeconds(submission.durationSeconds)}</span> : null}
                        <a href={submission.filePath} target="_blank" rel="noreferrer" className="font-medium text-brand-700">
                          Open file
                        </a>
                      </div>
                      {submission.notes ? <p className="mt-3 text-sm text-slate-600">Review notes: {submission.notes}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">You have not shared any photos or clips yet.</p>
                )}
              </div>
            </Card>

            <Card id="recent-games" className="scroll-mt-28 space-y-4">
              <h2 className="font-display text-2xl text-ink">Recent games</h2>
              <div className="space-y-3">
                {participations.length ? (
                  participations.map((participation) => (
                    <div key={participation.id} className="rounded-2xl border border-slate-100 p-4">
                      <p className="font-semibold text-ink">{participation.game.title}</p>
                      <p className="text-sm text-slate-500">
                        {participation.game.gameType.name} | {formatDateTime(participation.game.gameDate)}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">Fee charged: {formatCurrency(participation.feeCents)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No games have been recorded for your account yet.</p>
                )}
              </div>
            </Card>

            <Card className="space-y-4">
              <h2 className="font-display text-2xl text-ink">Account details</h2>
              <div className="space-y-2 text-sm text-slate-700">
                <p>Email: {member.email}</p>
                <p>Phone: {member.phone ?? "Not provided"}</p>
                <p>Jersey size: {member.jerseySize ?? "Not provided"}</p>
                <p>Member since: {formatDate(member.memberSince)}</p>
              </div>
            </Card>
          </div>
        </div>
      </PageShell>
    </main>
  );
}

function formatMemberMediaStatus(status: MemberMediaStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function memberMediaBadgeClassName(status: MemberMediaStatus) {
  switch (status) {
    case MemberMediaStatus.APPROVED:
      return "bg-brand-50 text-brand-800";
    case MemberMediaStatus.REVIEWED:
      return "bg-sky-50 text-sky-700";
    case MemberMediaStatus.ARCHIVED:
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}
