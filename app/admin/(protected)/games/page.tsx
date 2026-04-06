import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, SectionTitle, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteImportedGame, reassignImportedGameFeeRule } from "@/lib/game-admin";
import { importGamesWorkbook } from "@/lib/game-import";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage({
  searchParams
}: {
  searchParams?: Promise<{ saved?: string; deleted?: string; imported?: string; error?: string; gameUpdated?: string }>;
}) {
  const params = (await searchParams) ?? {};

  async function addGameType(formData: FormData) {
    "use server";
    await requireAdmin();

    await prisma.gameType.create({
      data: {
        name: String(formData.get("name") || ""),
        description: String(formData.get("description") || "") || null,
        feeCents: Math.round(Number(formData.get("fee")) * 100),
        sortOrder: Number(formData.get("sortOrder") || 0)
      }
    });

    revalidatePath("/admin/games");
    redirect("/admin/games?saved=1");
  }

  async function updateGameType(formData: FormData) {
    "use server";
    await requireAdmin();

    await prisma.gameType.update({
      where: {
        id: String(formData.get("gameTypeId") || "")
      },
      data: {
        name: String(formData.get("name") || ""),
        description: String(formData.get("description") || "") || null,
        feeCents: Math.round(Number(formData.get("fee")) * 100),
        sortOrder: Number(formData.get("sortOrder") || 0),
        isActive: String(formData.get("isActive") || "true") === "true"
      }
    });

    revalidatePath("/admin/games");
    redirect("/admin/games?saved=1");
  }

  async function deleteGameType(formData: FormData) {
    "use server";
    await requireAdmin();

    const gameTypeId = String(formData.get("gameTypeId") || "");
    const linkedGames = await prisma.game.count({
      where: { gameTypeId }
    });

    if (linkedGames > 0) {
      redirect("/admin/games?error=Delete+or+reassign+imported+games+before+removing+that+fee+rule.");
    }

    await prisma.gameType.delete({
      where: { id: gameTypeId }
    });

    revalidatePath("/admin/games");
    redirect("/admin/games?deleted=1");
  }

  async function importGames(formData: FormData) {
    "use server";
    await requireAdmin();

    const file = formData.get("workbook");
    if (!(file instanceof File)) {
      redirect("/admin/games?error=Choose+an+Excel+file+to+import.");
    }

    try {
      const createdCount = await importGamesWorkbook(file);
      revalidatePath("/admin/games");
      redirect(`/admin/games?imported=${createdCount}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to import the workbook.";
      redirect(`/admin/games?error=${encodeURIComponent(message)}`);
    }
  }

  async function reassignGame(formData: FormData) {
    "use server";
    await requireAdmin();

    const gameId = String(formData.get("gameId") || "");
    const gameTypeId = String(formData.get("gameTypeId") || "");

    try {
      await reassignImportedGameFeeRule(gameId, gameTypeId);
      revalidatePath("/admin/games");
      revalidatePath("/admin/members");
      revalidatePath("/admin/ledger");
      redirect("/admin/games?gameUpdated=1");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reassign the fee rule.";
      redirect(`/admin/games?error=${encodeURIComponent(message)}`);
    }
  }

  async function deleteGame(formData: FormData) {
    "use server";
    await requireAdmin();

    const gameId = String(formData.get("gameId") || "");

    try {
      await deleteImportedGame(gameId);
      revalidatePath("/admin/games");
      revalidatePath("/admin/members");
      revalidatePath("/admin/ledger");
      redirect("/admin/games?deleted=1");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete the imported game.";
      redirect(`/admin/games?error=${encodeURIComponent(message)}`);
    }
  }

  const [gameTypes, games] = await Promise.all([
    prisma.gameType.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    prisma.game.findMany({
      include: {
        gameType: true,
        _count: {
          select: { participations: true }
        }
      },
      orderBy: { gameDate: "desc" }
    })
  ]);

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Games"
        title="Manage fee rules and import league fixtures"
        description="Fee rules can be edited or deleted here. League games come from the treasurer's spreadsheet rather than being scheduled manually in the portal."
      />

      {params.saved ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">Fee rule saved.</div>
      ) : null}
      {params.deleted ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">Item deleted successfully.</div>
      ) : null}
      {params.gameUpdated ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Imported game reassigned to the new fee rule.
        </div>
      ) : null}
      {params.imported ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Imported {params.imported} new game{params.imported === "1" ? "" : "s"} from the workbook.
        </div>
      ) : null}
      {params.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{params.error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Add fee rule / game type</h2>
          <form action={addGameType} className="grid gap-4">
            <input name="name" placeholder="Game type name" required className={fieldClassName} />
            <input name="description" placeholder="Description" className={fieldClassName} />
            <input name="fee" type="number" step="0.01" min="0" placeholder="Fee in dollars" required className={fieldClassName} />
            <input name="sortOrder" type="number" defaultValue="0" className={fieldClassName} />
            <SubmitButton label="Create game type" pendingLabel="Saving..." />
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Import league games from Excel</h2>
          <p className="text-sm text-slate-600">
            Upload the league spreadsheet from the treasurer. Common columns can be named flexibly, such as
            <span className="font-mono"> game type</span>, <span className="font-mono">title</span>,
            <span className="font-mono"> opponent</span>, <span className="font-mono"> venue</span>,
            <span className="font-mono"> date</span>, <span className="font-mono"> status</span>, and
            <span className="font-mono"> notes</span>.
          </p>
          <form action={importGames} className="grid gap-4">
            <input name="workbook" type="file" accept=".xlsx,.xls,.csv" required className={fieldClassName} />
            <SubmitButton label="Import workbook" pendingLabel="Importing..." />
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Fee rules</h2>
          <div className="space-y-3">
            {gameTypes.map((type) => (
              <form key={type.id} action={updateGameType} className="grid gap-3 rounded-2xl border border-slate-100 p-4">
                <input type="hidden" name="gameTypeId" value={type.id} />
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="name" defaultValue={type.name} required className={fieldClassName} />
                  <input name="description" defaultValue={type.description ?? ""} placeholder="Description" className={fieldClassName} />
                  <input
                    name="fee"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(type.feeCents / 100).toFixed(2)}
                    required
                    className={fieldClassName}
                  />
                  <input name="sortOrder" type="number" defaultValue={type.sortOrder} className={fieldClassName} />
                  <select name="isActive" defaultValue={type.isActive ? "true" : "false"} className={fieldClassName}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-3">
                  <SubmitButton label="Save fee rule" pendingLabel="Saving..." />
                  <button
                    type="submit"
                    formAction={deleteGameType}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700"
                  >
                    Delete fee rule
                  </button>
                </div>
                <p className="text-sm font-semibold text-brand-700">{formatCurrency(type.feeCents)} per player</p>
              </form>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Imported league games</h2>
          <div className="space-y-3">
            {games.map((game) => (
              <form key={game.id} action={reassignGame} className="rounded-2xl border border-slate-100 p-4">
                <input type="hidden" name="gameId" value={game.id} />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{game.title}</p>
                    <p className="text-sm text-slate-500">
                      {game.gameType.name} | {formatDateTime(game.gameDate)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-brand-700">{game._count.participations} players assigned</p>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {game.venue ?? "Venue TBD"} | {game.status}
                </p>
                {game.notes ? <p className="mt-2 text-sm text-slate-500">{game.notes}</p> : null}
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <select name="gameTypeId" defaultValue={game.gameTypeId} className={fieldClassName}>
                    {gameTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} | {formatCurrency(type.feeCents)}
                      </option>
                    ))}
                  </select>
                  <SubmitButton label="Reassign fee rule" pendingLabel="Saving..." />
                  <button
                    type="submit"
                    formAction={deleteGame}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700"
                  >
                    Delete game
                  </button>
                </div>
              </form>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
