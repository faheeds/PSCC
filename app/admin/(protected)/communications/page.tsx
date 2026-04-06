import { CommunicationAudience, CommunicationChannel, CommunicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Card, SectionTitle, StatCard, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { getAdminDirectory } from "@/lib/club-operations";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CommunicationsAdminPage() {
  async function createCommunication(formData: FormData) {
    "use server";
    await requireAdmin();

    await prisma.communicationMessage.create({
      data: {
        subject: String(formData.get("subject") || ""),
        audience: String(formData.get("audience") || "ALL_MEMBERS") as CommunicationAudience,
        channel: String(formData.get("channel") || "EMAIL") as CommunicationChannel,
        status: String(formData.get("status") || "DRAFT") as CommunicationStatus,
        targetGroup: String(formData.get("targetGroup") || "") || null,
        body: String(formData.get("body") || ""),
        summary: String(formData.get("summary") || "") || null,
        scheduledFor: formData.get("scheduledFor") ? new Date(String(formData.get("scheduledFor"))) : null,
        sentAt: formData.get("sentAt") ? new Date(String(formData.get("sentAt"))) : null,
        createdByAdminId: String(formData.get("createdByAdminId") || "") || null
      }
    });

    revalidatePath("/admin/communications");
    revalidatePath("/admin/dashboard");
  }

  async function createLeagueLog(formData: FormData) {
    "use server";
    await requireAdmin();

    await prisma.leagueContactLog.create({
      data: {
        subject: String(formData.get("subject") || ""),
        counterpartName: String(formData.get("counterpartName") || "") || null,
        counterpartOrg: String(formData.get("counterpartOrg") || "") || "NWCL",
        channel: String(formData.get("channel") || "EMAIL") as CommunicationChannel,
        contactAt: new Date(String(formData.get("contactAt") || "")),
        summary: String(formData.get("summary") || ""),
        actionItems: String(formData.get("actionItems") || "") || null,
        nextStep: String(formData.get("nextStep") || "") || null,
        createdByAdminId: String(formData.get("createdByAdminId") || "") || null
      }
    });

    revalidatePath("/admin/communications");
    revalidatePath("/admin/dashboard");
  }

  const [admins, communications, leagueLogs, pendingCount] = await Promise.all([
    getAdminDirectory(),
    prisma.communicationMessage.findMany({
      include: { createdBy: true },
      orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
      take: 20
    }),
    prisma.leagueContactLog.findMany({
      include: { createdBy: true },
      orderBy: { contactAt: "desc" },
      take: 20
    }),
    prisma.communicationMessage.count({ where: { status: { in: ["DRAFT", "SCHEDULED"] } } })
  ]);

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Communications"
        title="Club communications and league relationship tracking"
        description="Plan messages to members, log league contact with NWCL, and keep a transparent record of follow-ups and responsibilities."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Pending messages" value={String(pendingCount)} />
        <StatCard label="Communications logged" value={String(communications.length)} />
        <StatCard label="League contacts logged" value={String(leagueLogs.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Add club communication</h2>
          <form action={createCommunication} className="grid gap-4 md:grid-cols-2">
            <input name="subject" placeholder="Subject" required className={fieldClassName} />
            <select name="createdByAdminId" defaultValue="" className={fieldClassName}>
              <option value="">Owner</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
            <select name="audience" defaultValue="ALL_MEMBERS" className={fieldClassName}>
              <option value="ALL_MEMBERS">All members</option>
              <option value="ADMINS">Admins</option>
              <option value="TEAM_CAPTAINS">Team captains</option>
              <option value="LEAGUE">League</option>
              <option value="EXTERNAL_PARTNERS">External partners</option>
              <option value="CUSTOM">Custom group</option>
            </select>
            <select name="channel" defaultValue="EMAIL" className={fieldClassName}>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="PHONE">Phone</option>
              <option value="IN_PERSON">In person</option>
              <option value="OTHER">Other</option>
            </select>
            <input name="targetGroup" placeholder="Target group label if custom" className={fieldClassName} />
            <select name="status" defaultValue="DRAFT" className={fieldClassName}>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="SENT">Sent</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <input name="scheduledFor" type="datetime-local" className={fieldClassName} />
            <input name="sentAt" type="datetime-local" className={fieldClassName} />
            <input
              name="summary"
              placeholder="Quick summary"
              className="md:col-span-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand-400 focus:ring-brand-400"
            />
            <textarea name="body" placeholder="Communication body" required className={`${fieldClassName} md:col-span-2 min-h-28`} />
            <SubmitButton label="Save communication" pendingLabel="Saving..." className="md:col-span-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" />
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Log NWCL or external communication</h2>
          <form action={createLeagueLog} className="grid gap-4 md:grid-cols-2">
            <input name="subject" placeholder="Topic" required className={fieldClassName} />
            <select name="createdByAdminId" defaultValue="" className={fieldClassName}>
              <option value="">Logged by</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
            <input name="counterpartName" placeholder="Counterpart name" className={fieldClassName} />
            <input name="counterpartOrg" placeholder="Organization" defaultValue="NWCL" className={fieldClassName} />
            <select name="channel" defaultValue="EMAIL" className={fieldClassName}>
              <option value="EMAIL">Email</option>
              <option value="PHONE">Phone</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="IN_PERSON">In person</option>
              <option value="OTHER">Other</option>
            </select>
            <input name="contactAt" type="datetime-local" required className={fieldClassName} />
            <textarea name="summary" placeholder="What was discussed?" required className={`${fieldClassName} md:col-span-2 min-h-24`} />
            <textarea name="actionItems" placeholder="Action items" className={`${fieldClassName} md:col-span-2 min-h-20`} />
            <input
              name="nextStep"
              placeholder="Next step"
              className="md:col-span-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand-400 focus:ring-brand-400"
            />
            <SubmitButton label="Save contact log" pendingLabel="Saving..." className="md:col-span-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" />
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Recent communications</h2>
          <div className="space-y-3">
            {communications.length ? (
              communications.map((communication) => (
                <div key={communication.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="font-semibold text-ink">{communication.subject}</p>
                  <p className="text-sm text-slate-500">
                    {communication.audience.replaceAll("_", " ")} | {communication.channel.replaceAll("_", " ")} | {communication.status.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{communication.summary ?? communication.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No communications have been recorded yet.</p>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">League and forum log</h2>
          <div className="space-y-3">
            {leagueLogs.length ? (
              leagueLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="font-semibold text-ink">{log.subject}</p>
                  <p className="text-sm text-slate-500">
                    {log.counterpartOrg} {log.counterpartName ? `| ${log.counterpartName}` : ""} | {formatDateTime(log.contactAt)}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{log.summary}</p>
                  {log.nextStep ? <p className="mt-2 text-sm font-medium text-brand-700">Next: {log.nextStep}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No NWCL or external communication logs yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
