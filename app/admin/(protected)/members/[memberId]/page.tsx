import { LedgerCategory, T20Team, T40Team } from "@prisma/client";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, SectionTitle, StatCard, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { computeBalanceCents, recordGameParticipation, createManualCharge } from "@/lib/ledger";
import { requireAdmin } from "@/lib/admin-auth";
import { formatT20Team, formatT40Team, T20_TEAM_OPTIONS, T40_TEAM_OPTIONS } from "@/lib/member-teams";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMemberDetailPage({
  params
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  async function addCharge(formData: FormData) {
    "use server";
    await requireAdmin();

    const category = String(formData.get("category") || "ADJUSTMENT") as LedgerCategory;
    const description = String(formData.get("description") || "");
    const rawAmount = Math.round(Number(formData.get("amount")) * 100);
    const amountCents = category === "CREDIT" || category === "PAYMENT" ? -Math.abs(rawAmount) : Math.abs(rawAmount);

    await createManualCharge({
      memberId,
      category,
      description,
      amountCents
    });

    revalidatePath(`/admin/members/${memberId}`);
    revalidatePath("/admin/members");
    revalidatePath("/admin/ledger");
  }

  async function addParticipation(formData: FormData) {
    "use server";
    await requireAdmin();

    await recordGameParticipation(memberId, String(formData.get("gameId") || ""));

    revalidatePath(`/admin/members/${memberId}`);
    revalidatePath("/admin/members");
    revalidatePath("/admin/games");
    revalidatePath("/admin/ledger");
  }

  async function updateTeams(formData: FormData) {
    "use server";
    await requireAdmin();

    await prisma.member.update({
      where: { id: memberId },
      data: {
        t40Team: parseOptionalT40Team(formData.get("t40Team")),
        t20Team: parseOptionalT20Team(formData.get("t20Team"))
      }
    });

    revalidatePath(`/admin/members/${memberId}`);
    revalidatePath("/admin/members");
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      ledgerEntries: {
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }]
      },
      participations: {
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
        }
      }
    }
  });

  if (!member) {
    notFound();
  }

  const games = await prisma.game.findMany({
    where: {
      id: {
        notIn: member.participations.map((participation) => participation.gameId)
      },
      status: { not: "CANCELLED" }
    },
    include: { gameType: true },
    orderBy: { gameDate: "desc" }
  });

  const balanceCents = computeBalanceCents(member.ledgerEntries);
  const totalCharges = member.ledgerEntries.filter((entry) => entry.amountCents > 0).reduce((sum, entry) => sum + entry.amountCents, 0);
  const totalPayments = Math.abs(member.ledgerEntries.filter((entry) => entry.amountCents < 0).reduce((sum, entry) => sum + entry.amountCents, 0));

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Member Detail"
        title={member.name}
        description={`${member.email} | ${member.phone ?? "No phone on file"} | ${member.jerseySize ?? "No jersey size"}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Current balance" value={formatCurrency(balanceCents)} tone={balanceCents > 0 ? "warning" : "success"} />
        <StatCard label="Total charges" value={formatCurrency(totalCharges)} />
        <StatCard label="Total payments" value={formatCurrency(totalPayments)} tone="success" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Team assignment</h2>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">Current T40 team</p>
              <p className="mt-2 text-lg font-semibold text-ink">{formatT40Team(member.t40Team)}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">Current T20 team</p>
              <p className="mt-2 text-lg font-semibold text-ink">{formatT20Team(member.t20Team)}</p>
            </div>
          </div>
          <form action={updateTeams} className="grid gap-4">
            <select name="t40Team" defaultValue={member.t40Team ?? ""} className={fieldClassName}>
              <option value="">No T40 team</option>
              {T40_TEAM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select name="t20Team" defaultValue={member.t20Team ?? ""} className={fieldClassName}>
              <option value="">No T20 team</option>
              {T20_TEAM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <SubmitButton label="Save team assignment" pendingLabel="Saving..." />
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Add manual charge, payment, or credit</h2>
          <form action={addCharge} className="grid gap-4">
            <select name="category" defaultValue="CLUB_FEE" className={fieldClassName}>
              <option value="CLUB_FEE">Club fee</option>
              <option value="UNIFORM">Uniform</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="PAYMENT">Payment received</option>
              <option value="CREDIT">Credit</option>
            </select>
            <input name="description" placeholder="Description" required className={fieldClassName} />
            <input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount in dollars" required className={fieldClassName} />
            <SubmitButton label="Post ledger entry" pendingLabel="Posting..." />
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Record game played</h2>
          <form action={addParticipation} className="grid gap-4">
            <select name="gameId" required className={fieldClassName} defaultValue="">
              <option value="" disabled>
                Select a game
              </option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title} | {game.gameType.name} | {formatDateTime(game.gameDate)}
                </option>
              ))}
            </select>
            <SubmitButton label="Add game participation" pendingLabel="Saving..." />
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Ledger history</h2>
          <div className="space-y-3">
            {member.ledgerEntries.map((entry) => (
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
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Recorded games</h2>
          <div className="space-y-3">
            {member.participations.length ? (
              member.participations.map((participation) => (
                <div key={participation.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="font-semibold text-ink">{participation.game.title}</p>
                  <p className="text-sm text-slate-500">
                    {participation.game.gameType.name} | {formatDateTime(participation.game.gameDate)}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">Fee snapshot: {formatCurrency(participation.feeCents)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No games recorded yet.</p>
            )}
          </div>
        </Card>
      </div>
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
