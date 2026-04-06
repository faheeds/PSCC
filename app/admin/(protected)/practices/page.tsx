import { PracticeStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Card, SectionTitle, StatCard } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getPracticeCheckInOpenTime, isPracticeCheckInOpen } from "@/lib/practice-checkins";
import { getPracticeGroundDefaults } from "@/lib/practice-location";
import {
  WEEKLY_PRACTICE_CANCELLATION_MESSAGE,
  ensureWeeklyPracticeSessions,
  getWeeklyPracticeWindowLabel
} from "@/lib/weekly-practices";
import { formatDateTime, formatDistanceMeters } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PracticesAdminPage() {
  await ensureWeeklyPracticeSessions({ pastWeeks: 4, futureWeeks: 6 });

  async function cancelPractice(formData: FormData) {
    "use server";
    await requireAdmin();

    const practiceId = String(formData.get("practiceId") || "");
    if (!practiceId) {
      return;
    }

    await prisma.practiceSession.update({
      where: { id: practiceId },
      data: {
        status: PracticeStatus.CANCELLED,
        cancellationReason: WEEKLY_PRACTICE_CANCELLATION_MESSAGE
      }
    });

    revalidatePath("/admin/practices");
    revalidatePath("/account");
  }

  async function reopenPractice(formData: FormData) {
    "use server";
    await requireAdmin();

    const practiceId = String(formData.get("practiceId") || "");
    if (!practiceId) {
      return;
    }

    await prisma.practiceSession.update({
      where: { id: practiceId },
      data: {
        status: PracticeStatus.PLANNED,
        cancellationReason: null
      }
    });

    revalidatePath("/admin/practices");
    revalidatePath("/account");
  }

  const now = new Date();
  const practiceGround = getPracticeGroundDefaults();
  const [upcomingPractices, recentPractices, cancelledCount] = await Promise.all([
    prisma.practiceSession.findMany({
      where: {
        recurrenceKey: {
          not: null
        },
        endsAt: {
          gte: now
        }
      },
      include: {
        checkIns: {
          include: {
            member: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: [{ arrivalOrder: "asc" }, { checkedInAt: "asc" }]
        }
      },
      orderBy: [{ startsAt: "asc" }],
      take: 6
    }),
    prisma.practiceSession.findMany({
      where: {
        recurrenceKey: {
          not: null
        },
        endsAt: {
          lt: now
        }
      },
      include: {
        checkIns: {
          include: {
            member: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: [{ arrivalOrder: "asc" }, { checkedInAt: "asc" }]
        }
      },
      orderBy: [{ startsAt: "desc" }],
      take: 4
    }),
    prisma.practiceSession.count({
      where: {
        recurrenceKey: {
          not: null
        },
        status: PracticeStatus.CANCELLED,
        startsAt: {
          gte: now
        }
      }
    })
  ]);

  const allPractices = [...upcomingPractices, ...recentPractices];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Practices"
        title="Weekly practice management"
        description="Practice happens automatically every Wednesday. Coordinators only need to cancel a week when weather or ground conditions make practice unavailable."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Weekly schedule" value={getWeeklyPracticeWindowLabel()} />
        <StatCard label="Ground" value="Bellevue practice field" />
        <StatCard label="Upcoming cancellations" value={String(cancelledCount)} tone={cancelledCount ? "warning" : "success"} />
      </div>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Standing practice details</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Address</p>
            <p className="mt-2 text-sm text-slate-700">{practiceGround.address}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Check-in window</p>
            <p className="mt-2 text-sm text-slate-700">Wednesday, 4:30 PM to 8:30 PM</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Allowed radius</p>
            <p className="mt-2 text-sm text-slate-700">{formatDistanceMeters(practiceGround.radiusMeters)}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Upcoming Wednesdays</h2>
        <div className="space-y-4">
          {upcomingPractices.map((practice) => (
            <div key={practice.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-semibold text-ink">{practice.title}</p>
                  <p className="text-sm text-slate-500">
                    {formatDateTime(practice.startsAt)} to {formatDateTime(practice.endsAt)}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{practice.location}</p>
                  <p className="mt-2 text-sm text-slate-700">Check-in opens at {formatDateTime(getPracticeCheckInOpenTime(practice.startsAt))}</p>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>Status: {practice.status === PracticeStatus.CANCELLED ? "Canceled" : "Scheduled"}</p>
                  <p>Checked in: {practice.checkIns.length}</p>
                  <p>{isPracticeCheckInOpen(practice, now) ? "Check-in currently open" : "Check-in currently closed"}</p>
                </div>
              </div>

              {practice.status === PracticeStatus.CANCELLED ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {practice.cancellationReason || WEEKLY_PRACTICE_CANCELLATION_MESSAGE}
                </div>
              ) : null}

              <div className="mt-4">
                {practice.status === PracticeStatus.CANCELLED ? (
                  <form action={reopenPractice}>
                    <input type="hidden" name="practiceId" value={practice.id} />
                    <SubmitButton
                      label="Reopen practice"
                      pendingLabel="Updating..."
                      className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    />
                  </form>
                ) : (
                  <form action={cancelPractice}>
                    <input type="hidden" name="practiceId" value={practice.id} />
                    <SubmitButton
                      label="Cancel practice due to weather"
                      pendingLabel="Canceling..."
                      className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    />
                  </form>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                <div className="space-y-1">
                  <p className="font-semibold text-ink">Batting-order check-in list</p>
                  <p className="text-sm text-slate-600">Members appear here in the exact order they checked in at the ground.</p>
                </div>
                <div className="mt-3 space-y-3">
                  {practice.checkIns.length ? (
                    practice.checkIns.map((checkIn) => (
                      <div key={checkIn.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3">
                        <div>
                          <p className="font-semibold text-ink">
                            #{checkIn.arrivalOrder} {checkIn.member.name}
                          </p>
                          <p className="text-sm text-slate-500">{formatDateTime(checkIn.checkedInAt)}</p>
                        </div>
                        {checkIn.distanceMeters !== null ? <p className="text-sm text-slate-600">{formatDistanceMeters(checkIn.distanceMeters)}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No member has checked in for this practice yet.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Recent Wednesdays</h2>
        <div className="space-y-3">
          {recentPractices.length ? (
            recentPractices.map((practice) => (
              <div key={practice.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{formatDateTime(practice.startsAt)}</p>
                    <p className="text-sm text-slate-500">{practice.location}</p>
                  </div>
                  <div className="text-sm text-slate-700">
                    <p>Status: {practice.status}</p>
                    <p>Checked in: {practice.checkIns.length}</p>
                  </div>
                </div>
                {practice.status === PracticeStatus.CANCELLED ? (
                  <p className="mt-3 text-sm font-medium text-rose-700">{practice.cancellationReason || WEEKLY_PRACTICE_CANCELLATION_MESSAGE}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No weekly practice records yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
