import bcrypt from "bcryptjs";
import Link from "next/link";
import { MemberStatus, T20Team, T40Team } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, SectionTitle, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { computeBalanceCents, getGameTypeBucket, importMemberDuesCsv, summarizePayments } from "@/lib/ledger";
import { requireAdmin } from "@/lib/admin-auth";
import { formatT20Team, formatT40Team, importMemberTeamsWorkbook, T20_TEAM_OPTIONS, T40_TEAM_OPTIONS } from "@/lib/member-teams";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage({
  searchParams
}: {
  searchParams?: Promise<{ imported?: string; created?: string; teamsImported?: string; updated?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};

  async function addMember(formData: FormData) {
    "use server";
    await requireAdmin();

    const passwordHash = await bcrypt.hash(String(formData.get("password") || ""), 12);

    await prisma.member.create({
      data: {
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || "").toLowerCase(),
        phone: String(formData.get("phone") || "") || null,
        jerseySize: String(formData.get("jerseySize") || "") || null,
        t40Team: parseOptionalT40Team(formData.get("t40Team")),
        t20Team: parseOptionalT20Team(formData.get("t20Team")),
        passwordHash,
        status: (String(formData.get("status") || "ACTIVE") as MemberStatus) ?? MemberStatus.ACTIVE
      }
    });

    revalidatePath("/admin/members");
    redirect("/admin/members?created=1");
  }

  async function importDues(formData: FormData) {
    "use server";
    await requireAdmin();

    const csvText = String(formData.get("csvText") || "");
    const file = formData.get("csvFile");
    const uploadedText =
      file && typeof file === "object" && "text" in file && typeof file.text === "function" ? await file.text() : "";
    const csvContent = uploadedText || csvText;

    try {
      const importedCount = await importMemberDuesCsv(csvContent);
      revalidatePath("/admin/members");
      revalidatePath("/admin/ledger");
      revalidatePath("/admin/dashboard");
      redirect(`/admin/members?imported=${importedCount}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to import dues.";
      redirect(`/admin/members?error=${encodeURIComponent(message)}`);
    }
  }

  async function importTeams(formData: FormData) {
    "use server";
    await requireAdmin();

    const file = formData.get("workbook");
    if (!(file instanceof File)) {
      redirect("/admin/members?error=Choose+an+Excel+or+CSV+file+before+importing+team+selections.");
    }

    try {
      const importedCount = await importMemberTeamsWorkbook(file);
      revalidatePath("/admin/members");
      revalidatePath("/admin/dashboard");
      redirect(`/admin/members?teamsImported=${importedCount}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to import team selections.";
      redirect(`/admin/members?error=${encodeURIComponent(message)}`);
    }
  }

  async function updateMemberTeams(formData: FormData) {
    "use server";
    await requireAdmin();

    const memberId = String(formData.get("memberId") || "");
    if (!memberId) {
      redirect("/admin/members?error=Choose+a+member+before+updating+teams.");
    }

    await prisma.member.update({
      where: { id: memberId },
      data: {
        t40Team: parseOptionalT40Team(formData.get("t40Team")),
        t20Team: parseOptionalT20Team(formData.get("t20Team"))
      }
    });

    revalidatePath("/admin/members");
    redirect("/admin/members?updated=1");
  }

  const members = await prisma.member.findMany({
    include: {
      ledgerEntries: {
        select: { amountCents: true }
      },
      participations: {
        include: {
          game: {
            include: {
              gameType: true
            }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });

  const activeMembers = members
    .filter((member) => member.status === "ACTIVE")
    .map((member) => {
      const balanceCents = computeBalanceCents(member.ledgerEntries);
      const totalPaidCents = summarizePayments(member.ledgerEntries);
      const t40Games = member.participations.filter((participation) => getGameTypeBucket(participation.game.gameType.name) === "T40").length;
      const t20Games = member.participations.filter((participation) => getGameTypeBucket(participation.game.gameType.name) === "T20").length;

      return {
        ...member,
        balanceCents,
        totalPaidCents,
        t40Games,
        t20Games,
        totalGames: member.participations.length
      };
    });

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Members"
        title="Create member accounts and track team placement"
        description="Each member can belong to at most one T40 team and one T20 team at a time, and some members may have no team assigned yet."
      />

      {params.created ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Member account created successfully.
        </div>
      ) : null}
      {params.imported ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Imported {params.imported} dues record{params.imported === "1" ? "" : "s"} into the ledger.
        </div>
      ) : null}
      {params.teamsImported ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Imported team selections for {params.teamsImported} member{params.teamsImported === "1" ? "" : "s"}.
        </div>
      ) : null}
      {params.updated ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">Member teams updated successfully.</div>
      ) : null}
      {params.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{params.error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Add member</h2>
          <form action={addMember} className="grid gap-4">
            <input name="name" placeholder="Full name" required className={fieldClassName} />
            <input name="email" type="email" placeholder="Email address" required className={fieldClassName} />
            <input name="phone" placeholder="Phone number" className={fieldClassName} />
            <input name="jerseySize" placeholder="Jersey size" className={fieldClassName} />
            <select name="t40Team" defaultValue="" className={fieldClassName}>
              <option value="">No T40 team</option>
              {T40_TEAM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select name="t20Team" defaultValue="" className={fieldClassName}>
              <option value="">No T20 team</option>
              {T20_TEAM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input name="password" type="password" placeholder="Temporary password" required className={fieldClassName} />
            <select name="status" defaultValue="ACTIVE" className={fieldClassName}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <SubmitButton label="Create member" pendingLabel="Creating..." />
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Bulk upload dues details</h2>
          <p className="text-sm text-slate-600">
            Upload a CSV or paste rows with columns: <span className="font-mono">email,description,amount,category,occurredAt</span>.
            Category is optional and defaults to <span className="font-mono">CLUB_FEE</span>.
          </p>
          <form action={importDues} className="grid gap-4">
            <input name="csvFile" type="file" accept=".csv,text/csv" className={fieldClassName} />
            <textarea
              name="csvText"
              rows={8}
              placeholder={"email,description,amount,category,occurredAt\narjun@pscc.org,2026 annual dues,120,CLUB_FEE,2026-04-01\nhamza@pscc.org,Uniform order,45,UNIFORM,2026-04-05"}
              className={fieldClassName}
            />
            <SubmitButton label="Import dues CSV" pendingLabel="Importing..." />
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Bulk upload team selections</h2>
          <p className="text-sm text-slate-600">
            Upload an Excel, XLS, or CSV file with columns like <span className="font-mono">email,t40Team,t20Team</span>. Leave a team cell blank if the member
            does not currently have a team.
          </p>
          <form action={importTeams} className="grid gap-4">
            <input name="workbook" type="file" accept=".xlsx,.xls,.csv,text/csv" required className={fieldClassName} />
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Example values:
              <div className="mt-2 font-mono text-xs text-slate-700">
                email,t40Team,t20Team
                <br />
                arjun@pscc.org,PSCC Steelheads,PSCC Cohos
                <br />
                hamza@pscc.org,PSCC Chinooks,
              </div>
            </div>
            <SubmitButton label="Import team workbook" pendingLabel="Importing..." />
          </form>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-2xl text-ink">Active members table</h2>
            <p className="text-sm text-slate-600">
              Team assignments can be updated here anytime, and the table still shows each member’s games, total paid, and remaining balance.
            </p>
          </div>
          <p className="text-sm text-slate-500">{activeMembers.length} active members</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-3 py-2 font-medium">Member</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                <th className="px-3 py-2 font-medium">Jersey</th>
                <th className="px-3 py-2 font-medium">Joined</th>
                <th className="px-3 py-2 font-medium">T40 team</th>
                <th className="px-3 py-2 font-medium">T20 team</th>
                <th className="px-3 py-2 font-medium">T40 games</th>
                <th className="px-3 py-2 font-medium">T20 games</th>
                <th className="px-3 py-2 font-medium">Total games</th>
                <th className="px-3 py-2 font-medium">Total paid</th>
                <th className="px-3 py-2 font-medium">Remaining balance</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {activeMembers.map((member) => (
                <tr key={member.id} className="rounded-2xl bg-slate-50 text-slate-700">
                  <td className="rounded-l-2xl px-3 py-4">
                    <div>
                      <p className="font-semibold text-ink">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </td>
                  <td className="px-3 py-4">{member.phone ?? "—"}</td>
                  <td className="px-3 py-4">{member.jerseySize ?? "—"}</td>
                  <td className="px-3 py-4">{formatDate(member.memberSince)}</td>
                  <td className="px-3 py-4">{formatT40Team(member.t40Team)}</td>
                  <td className="px-3 py-4">{formatT20Team(member.t20Team)}</td>
                  <td className="px-3 py-4">{member.t40Games}</td>
                  <td className="px-3 py-4">{member.t20Games}</td>
                  <td className="px-3 py-4">{member.totalGames}</td>
                  <td className="px-3 py-4 font-semibold text-brand-700">{formatCurrency(member.totalPaidCents)}</td>
                  <td className={`px-3 py-4 font-semibold ${member.balanceCents > 0 ? "text-amber-700" : "text-brand-700"}`}>
                    {formatCurrency(member.balanceCents)}
                  </td>
                  <td className="rounded-r-2xl px-3 py-4">
                    <form action={updateMemberTeams} className="space-y-2">
                      <input type="hidden" name="memberId" value={member.id} />
                      <select name="t40Team" defaultValue={member.t40Team ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                        <option value="">No T40 team</option>
                        {T40_TEAM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select name="t20Team" defaultValue={member.t20Team ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                        <option value="">No T20 team</option>
                        {T20_TEAM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <SubmitButton label="Save teams" pendingLabel="Saving..." className="rounded-full bg-brand-700 px-3 py-2 text-xs font-semibold text-white" />
                        <Link href={`/admin/members/${member.id}`} className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white no-underline">
                          Open
                        </Link>
                      </div>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function parseOptionalT40Team(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? (text as T40Team) : null;
}

function parseOptionalT20Team(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? (text as T20Team) : null;
}
