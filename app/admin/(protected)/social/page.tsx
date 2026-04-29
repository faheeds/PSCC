import { MediaContentType, MemberMediaStatus, MemberMediaType, SocialPostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Badge, Card, SectionTitle, StatCard, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { getAdminDirectory } from "@/lib/club-operations";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDateTime, formatDurationSeconds, formatFileSize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SocialMediaAdminPage() {
  async function createContentItem(formData: FormData) {
    "use server";
    await requireAdmin();

    await prisma.socialContentItem.create({
      data: {
        title: String(formData.get("title") || ""),
        contentType: String(formData.get("contentType") || "PHOTO") as MediaContentType,
        eventTitle: String(formData.get("eventTitle") || "") || null,
        capturedAt: formData.get("capturedAt") ? new Date(String(formData.get("capturedAt"))) : null,
        sourceUrl: String(formData.get("sourceUrl") || "") || null,
        caption: String(formData.get("caption") || "") || null,
        hashtags: String(formData.get("hashtags") || "") || null,
        platforms: String(formData.get("platforms") || "") || null,
        status: String(formData.get("status") || "DRAFT") as SocialPostStatus,
        scheduledFor: formData.get("scheduledFor") ? new Date(String(formData.get("scheduledFor"))) : null,
        postedAt: formData.get("postedAt") ? new Date(String(formData.get("postedAt"))) : null,
        notes: String(formData.get("notes") || "") || null,
        createdByAdminId: String(formData.get("createdByAdminId") || "") || null
      }
    });

    revalidatePath("/admin/social");
    revalidatePath("/admin/dashboard");
  }

  async function reviewMemberSubmission(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    const adminUserId = session.user?.adminUserId;

    const submissionId = String(formData.get("submissionId") || "");
    const status = String(formData.get("status") || MemberMediaStatus.REVIEWED) as MemberMediaStatus;
    const notes = String(formData.get("notes") || "").trim();

    if (!submissionId || !adminUserId) {
      return;
    }

    await prisma.memberMediaSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        notes: notes || null,
        reviewedAt: new Date(),
        reviewedByAdminId: adminUserId
      }
    });

    revalidatePath("/admin/social");
    revalidatePath("/account");
  }

  const [admins, items, draftCount, postedCount, memberSubmissions, pendingSubmissionsCount] = await Promise.all([
    getAdminDirectory(),
    prisma.socialContentItem.findMany({
      include: { createdBy: true },
      orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }],
      take: 20
    }),
    prisma.socialContentItem.count({ where: { status: { in: ["DRAFT", "READY_TO_POST", "SCHEDULED"] } } }),
    prisma.socialContentItem.count({ where: { status: "POSTED" } }),
    prisma.memberMediaSubmission.findMany({
      include: {
        member: true,
        reviewedBy: true
      },
      orderBy: [{ createdAt: "desc" }],
      take: 30
    }),
    prisma.memberMediaSubmission.count({
      where: {
        status: MemberMediaStatus.SUBMITTED
      }
    })
  ]);

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Social Media"
        title="Media capture, content planning, and posting status"
        description="Track photos and videos from games, practices, and events so the social team always knows what needs to be posted next."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Items waiting to post" value={String(draftCount)} />
        <StatCard label="Posted items" value={String(postedCount)} tone="success" />
        <StatCard label="Member uploads waiting" value={String(pendingSubmissionsCount)} tone={pendingSubmissionsCount ? "warning" : "success"} />
      </div>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Add social content item</h2>
        <form action={createContentItem} className="grid gap-4 md:grid-cols-2">
          <input name="title" placeholder="Content title" required className={fieldClassName} />
          <input name="eventTitle" placeholder="Game, practice, or event" className={fieldClassName} />
          <select name="contentType" defaultValue="PHOTO" className={fieldClassName}>
            <option value="PHOTO">Photo</option>
            <option value="VIDEO">Video</option>
            <option value="ALBUM">Album</option>
            <option value="REEL">Reel</option>
            <option value="STORY">Story</option>
            <option value="OTHER">Other</option>
          </select>
          <select name="createdByAdminId" defaultValue="" className={fieldClassName}>
            <option value="">Owner</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>
          <input name="capturedAt" type="datetime-local" className={fieldClassName} />
          <input name="sourceUrl" placeholder="Drive, Photos, or folder URL" className={fieldClassName} />
          <input name="platforms" placeholder="Instagram, Facebook, WhatsApp, YouTube" className={fieldClassName} />
          <select name="status" defaultValue="DRAFT" className={fieldClassName}>
            <option value="DRAFT">Draft</option>
            <option value="READY_TO_POST">Ready to post</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="POSTED">Posted</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <input name="scheduledFor" type="datetime-local" className={fieldClassName} />
          <input name="postedAt" type="datetime-local" className={fieldClassName} />
          <textarea name="caption" placeholder="Caption draft" className={`${fieldClassName} md:col-span-2 min-h-24`} />
          <input
            name="hashtags"
            placeholder="#pugetsoundcricket #pscc"
            className="md:col-span-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand-400 focus:ring-brand-400"
          />
          <textarea name="notes" placeholder="Shot list, missing clips, or posting notes" className={`${fieldClassName} md:col-span-2 min-h-24`} />
          <SubmitButton label="Save content item" pendingLabel="Saving..." className="md:col-span-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" />
        </form>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Content queue</h2>
        <div className="space-y-3">
          {items.length ? (
            items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="text-sm text-slate-500">
                      {item.contentType}
                      {item.eventTitle ? ` | ${item.eventTitle}` : ""}
                      {item.capturedAt ? ` | ${formatDateTime(item.capturedAt)}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-navy-300">
                      {item.createdBy?.name ?? "No owner assigned"}
                      {item.platforms ? ` | ${item.platforms}` : ""}
                    </p>
                  </div>
                  <div className="text-sm text-navy-300">
                    <p>Status: {item.status.replaceAll("_", " ")}</p>
                    <p>{item.postedAt ? `Posted ${formatDateTime(item.postedAt)}` : item.scheduledFor ? `Scheduled ${formatDateTime(item.scheduledFor)}` : "Not scheduled yet"}</p>
                  </div>
                </div>
                {item.caption ? <p className="mt-3 text-sm text-navy-300">{item.caption}</p> : null}
                {item.sourceUrl ? (
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium">
                    Open source media
                  </a>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No social content has been added yet.</p>
          )}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-display text-2xl text-ink">Member submissions</h2>
          <p className="text-sm text-slate-600">
            Review every photo and short video shared by club members, then mark what is ready for the social team.
          </p>
        </div>
        <div className="space-y-4">
          {memberSubmissions.length ? (
            memberSubmissions.map((submission) => (
              <div key={submission.id} className="rounded-[1.75rem] border border-slate-100 p-4">
                <div className="grid gap-4 xl:grid-cols-[240px_1fr]">
                  <div className="overflow-hidden rounded-[1.5rem] bg-slate-100">
                    {submission.mediaType === MemberMediaType.VIDEO ? (
                      <video src={submission.filePath} controls className="h-56 w-full object-cover" preload="metadata" />
                    ) : (
                      <img src={submission.filePath} alt={submission.title} className="h-56 w-full object-cover" />
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-ink">{submission.title}</p>
                        <p className="text-sm text-slate-500">
                          {submission.member.name} | {submission.member.email}
                          {submission.eventTitle ? ` | ${submission.eventTitle}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {submission.mediaType === MemberMediaType.VIDEO ? "Video" : "Photo"} | Shared {formatDateTime(submission.createdAt)}
                        </p>
                      </div>
                      <Badge tone={memberMediaBadgeClassName(submission.status)}>{formatMemberMediaStatus(submission.status)}</Badge>
                    </div>

                    {submission.caption ? <p className="text-sm text-navy-300">{submission.caption}</p> : null}

                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      <span>{formatFileSize(submission.sizeBytes)}</span>
                      {submission.durationSeconds ? <span>{formatDurationSeconds(submission.durationSeconds)}</span> : null}
                      <a href={submission.filePath} target="_blank" rel="noreferrer" className="font-medium text-brand-700">
                        Open original file
                      </a>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {submission.reviewedAt ? (
                        <p>
                          Last reviewed {formatDateTime(submission.reviewedAt)}
                          {submission.reviewedBy ? ` by ${submission.reviewedBy.name}` : ""}
                        </p>
                      ) : (
                        <p>Not reviewed yet.</p>
                      )}
                      {submission.notes ? <p className="mt-1 text-navy-300">Notes: {submission.notes}</p> : null}
                    </div>

                    <form action={reviewMemberSubmission} className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                      <input type="hidden" name="submissionId" value={submission.id} />
                      <select name="status" defaultValue={submission.status} className={fieldClassName}>
                        <option value={MemberMediaStatus.SUBMITTED}>Submitted</option>
                        <option value={MemberMediaStatus.REVIEWED}>Reviewed</option>
                        <option value={MemberMediaStatus.APPROVED}>Approved</option>
                        <option value={MemberMediaStatus.ARCHIVED}>Archived</option>
                      </select>
                      <input
                        name="notes"
                        defaultValue={submission.notes ?? ""}
                        placeholder="Review notes for the member or social team"
                        className={fieldClassName}
                      />
                      <SubmitButton
                        label="Save review"
                        pendingLabel="Saving..."
                        className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      />
                    </form>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No member-submitted media has been shared yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function formatMemberMediaStatus(status: MemberMediaStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function memberMediaBadgeClassName(status: MemberMediaStatus): "success" | "default" | "warning" | "error" {
  switch (status) {
    case MemberMediaStatus.APPROVED:
      return "success";
    case MemberMediaStatus.REVIEWED:
      return "default";
    case MemberMediaStatus.ARCHIVED:
      return "default";
    default:
      return "warning";
  }
}


