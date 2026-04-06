import { GroundBookingStatus, GroundUsageType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, SectionTitle, StatCard, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const purposeOptions = [
  { value: GroundUsageType.PSCC_PRACTICE, label: "Allocated for Practice to PSCC" },
  { value: GroundUsageType.PSCC_LEAGUE, label: "Allocated for PSCC League games" },
  { value: GroundUsageType.OTHER_CLUB_LEAGUE, label: "Allocated to other club for League games" },
  { value: GroundUsageType.OTHER_CLUB_OTHER, label: "Allocated to other club for other purposes" },
  { value: GroundUsageType.OTHER_PURPOSE, label: "Other Purpose" }
] as const;

export default async function GroundsAdminPage(props: {
  searchParams?: Promise<{
    imported?: string;
    created?: string;
    updated?: string;
    skipped?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const searchParams = (await props.searchParams) ?? {};

  async function bulkAllocateBookings(formData: FormData) {
    "use server";
    await requireAdmin();

    const bookingIds = Array.from(new Set(formData.getAll("bookingIds").map((value) => String(value)).filter(Boolean)));
    if (!bookingIds.length) {
      redirect("/admin/grounds?error=Select+at+least+one+available+date+to+allocate.");
    }

    const usageType = String(formData.get("usageType") || GroundUsageType.PSCC_PRACTICE) as GroundUsageType;
    const allocatedToName = String(formData.get("allocatedToName") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    await prisma.groundAllocation.deleteMany({
      where: {
        groundBookingId: {
          in: bookingIds
        }
      }
    });

    await prisma.groundAllocation.createMany({
      data: bookingIds.map((groundBookingId) => ({
        groundBookingId,
        usageType,
        allocatedToName: allocatedToName || getGroundUsageTypeLabel(usageType),
        amountCents: 0,
        notes: notes || null
      }))
    });

    revalidatePath("/admin/grounds");
    revalidatePath("/admin/dashboard");
    redirect(`/admin/grounds?success=${encodeURIComponent(`Allocated ${bookingIds.length} date${bookingIds.length === 1 ? "" : "s"}.`)}`);
  }

  async function releaseBookings(formData: FormData) {
    "use server";
    await requireAdmin();

    const bookingIds = Array.from(new Set(formData.getAll("bookingIds").map((value) => String(value)).filter(Boolean)));
    if (!bookingIds.length) {
      redirect("/admin/grounds?error=Select+at+least+one+allocated+date+to+mark+available+again.");
    }

    await prisma.groundAllocation.deleteMany({
      where: {
        groundBookingId: {
          in: bookingIds
        }
      }
    });

    revalidatePath("/admin/grounds");
    revalidatePath("/admin/dashboard");
    redirect(`/admin/grounds?success=${encodeURIComponent(`Marked ${bookingIds.length} date${bookingIds.length === 1 ? "" : "s"} as available.`)}`);
  }

  const bookings = await prisma.groundBooking.findMany({
    where: {
      status: {
        not: GroundBookingStatus.CANCELLED
      }
    },
    include: {
      allocations: {
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 1
      }
    },
    orderBy: [{ startAt: "asc" }]
  });

  const bookingCards = bookings.map((booking) => ({
    ...booking,
    currentAllocation: booking.allocations[0] ?? null
  }));

  const allocatedBookings = bookingCards.filter((booking) => booking.currentAllocation);
  const availableBookings = bookingCards.filter((booking) => !booking.currentAllocation);

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Grounds"
        title="Available dates and simple allocation"
        description="Import the city confirmation to get the dates we have. Any imported date stays available until the ground manager allocates it."
      />

      {searchParams.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{searchParams.error}</div>
      ) : null}
      {searchParams.success ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">{searchParams.success}</div>
      ) : null}
      {searchParams.imported ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Imported {searchParams.imported} document{searchParams.imported === "1" ? "" : "s"}.
          {` Created ${searchParams.created ?? "0"}, updated ${searchParams.updated ?? "0"}, skipped ${searchParams.skipped ?? "0"} older entries.`}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Dates we have" value={String(bookingCards.length)} />
        <StatCard label="Allocated" value={String(allocatedBookings.length)} />
        <StatCard label="Available" value={String(availableBookings.length)} tone={availableBookings.length ? "success" : "default"} />
      </div>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Import city confirmations</h2>
        <p className="text-sm text-slate-600">
          Upload one or more Bellevue permit PDFs. The app reads each booked date and time, and if a later PDF has the same booking, the one with the newer
          Authorized Date replaces the older one.
        </p>
        <form action="/admin/grounds/import" method="post" encType="multipart/form-data" className="space-y-4">
          <input
            name="files"
            type="file"
            accept="application/pdf"
            multiple
            required
            className={`${fieldClassName} file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-900`}
          />
          <SubmitButton label="Import confirmations" pendingLabel="Importing..." />
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-2xl text-ink">Available dates</h2>
            <p className="text-sm text-slate-600">These dates are ours and still unallocated.</p>
          </div>

          {availableBookings.length ? (
            <form action={bulkAllocateBookings} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <select name="usageType" defaultValue={GroundUsageType.PSCC_PRACTICE} className={fieldClassName}>
                  {purposeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input name="allocatedToName" placeholder="Team, club, or short detail" className={fieldClassName} />
              </div>
              <textarea name="notes" placeholder="Optional note" className={`${fieldClassName} min-h-24`} />

              <div className="space-y-3">
                {availableBookings.map((booking) => (
                  <label key={booking.id} className="flex gap-3 rounded-2xl border border-slate-100 p-4">
                    <input type="checkbox" name="bookingIds" value={booking.id} className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-700" />
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-ink">{formatGroundSlotLabel(booking.startAt, booking.endAt)}</p>
                      <p className="text-sm text-slate-600">
                        {booking.groundName}
                        {booking.facilityName ? ` | ${booking.facilityName}` : ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        Permit {booking.permitReference ?? "Manual"}
                        {booking.authorizedAt ? ` | Authorized ${formatDateTime(booking.authorizedAt)}` : ""}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <SubmitButton label="Allocate selected dates" pendingLabel="Allocating..." />
            </form>
          ) : (
            <p className="text-sm text-slate-500">No unallocated dates right now.</p>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-2xl text-ink">Allocated dates</h2>
            <p className="text-sm text-slate-600">These dates have already been assigned. Release any date to make it available again.</p>
          </div>

          {allocatedBookings.length ? (
            <form action={releaseBookings} className="space-y-4">
              <div className="space-y-3">
                {allocatedBookings.map((booking) => (
                  <label key={booking.id} className="flex gap-3 rounded-2xl border border-slate-100 p-4">
                    <input type="checkbox" name="bookingIds" value={booking.id} className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-700" />
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-ink">{formatGroundSlotLabel(booking.startAt, booking.endAt)}</p>
                      <p className="text-sm text-slate-600">
                        {booking.groundName}
                        {booking.facilityName ? ` | ${booking.facilityName}` : ""}
                      </p>
                      <p className="text-sm text-slate-700">
                        {getGroundUsageTypeLabel(booking.currentAllocation!.usageType)}
                        {booking.currentAllocation?.allocatedToName ? ` | ${booking.currentAllocation.allocatedToName}` : ""}
                      </p>
                      {booking.currentAllocation?.notes ? <p className="text-xs text-slate-500">{booking.currentAllocation.notes}</p> : null}
                    </div>
                  </label>
                ))}
              </div>

              <SubmitButton label="Mark selected as available" pendingLabel="Updating..." />
            </form>
          ) : (
            <p className="text-sm text-slate-500">No dates have been allocated yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function getGroundUsageTypeLabel(value: GroundUsageType) {
  switch (value) {
    case GroundUsageType.PSCC_PRACTICE:
      return "Allocated for Practice to PSCC";
    case GroundUsageType.PSCC_LEAGUE:
      return "Allocated for PSCC League games";
    case GroundUsageType.OTHER_CLUB_LEAGUE:
      return "Allocated to other club for League games";
    case GroundUsageType.OTHER_CLUB_OTHER:
      return "Allocated to other club for other purposes";
    case GroundUsageType.OTHER_PURPOSE:
      return "Other Purpose";
    case GroundUsageType.PSCC_TEAM:
      return "Allocated for PSCC";
    case GroundUsageType.EXTERNAL_CLUB:
      return "Allocated to other club";
    case GroundUsageType.SHARED:
      return "Shared allocation";
    case GroundUsageType.CLUB_EVENT:
      return "Club event";
    default:
      return String(value).replaceAll("_", " ");
  }
}

function formatGroundSlotLabel(startAt: Date, endAt: Date) {
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(startAt));

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  return `${day} | ${time.format(new Date(startAt))} - ${time.format(new Date(endAt))}`;
}
