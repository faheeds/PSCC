import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, SectionTitle, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminScorecardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ gameId?: string; saved?: string }>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};

  async function saveScorecard(formData: FormData) {
    "use server";
    await requireAdmin();

    const gameId = String(formData.get("gameId") || "");
    const memberId = String(formData.get("memberId") || "");
    const type = String(formData.get("type") || "");

    if (type === "batting") {
      await prisma.battingPerformance.upsert({
        where: { gameId_memberId: { gameId, memberId } },
        create: {
          gameId, memberId,
          runs: Number(formData.get("runs") || 0),
          balls: Number(formData.get("balls") || 0),
          fours: Number(formData.get("fours") || 0),
          sixes: Number(formData.get("sixes") || 0),
          isOut: formData.get("isOut") === "true",
          dismissal: String(formData.get("dismissal") || "") || null,
          battingOrder: Number(formData.get("battingOrder") || 0) || null,
        },
        update: {
          runs: Number(formData.get("runs") || 0),
          balls: Number(formData.get("balls") || 0),
          fours: Number(formData.get("fours") || 0),
          sixes: Number(formData.get("sixes") || 0),
          isOut: formData.get("isOut") === "true",
          dismissal: String(formData.get("dismissal") || "") || null,
        },
      });
    } else if (type === "bowling") {
      await prisma.bowlingPerformance.upsert({
        where: { gameId_memberId: { gameId, memberId } },
        create: {
          gameId, memberId,
          overs: Number(formData.get("overs") || 0),
          maidens: Number(formData.get("maidens") || 0),
          runs: Number(formData.get("runs") || 0),
          wickets: Number(formData.get("wickets") || 0),
          wides: Number(formData.get("wides") || 0),
          noBalls: Number(formData.get("noBalls") || 0),
        },
        update: {
          overs: Number(formData.get("overs") || 0),
          maidens: Number(formData.get("maidens") || 0),
          runs: Number(formData.get("runs") || 0),
          wickets: Number(formData.get("wickets") || 0),
          wides: Number(formData.get("wides") || 0),
          noBalls: Number(formData.get("noBalls") || 0),
        },
      });
    }

    revalidatePath("/admin/scorecards");
    redirect(`/admin/scorecards?gameId=${gameId}&saved=1`);
  }

  async function updateGameResult(formData: FormData) {
    "use server";
    await requireAdmin();
    const gameId = String(formData.get("gameId") || "");
    await prisma.game.update({
      where: { id: gameId },
      data: {
        psccScore: String(formData.get("psccScore") || "") || null,
        opponentScore: String(formData.get("opponentScore") || "") || null,
        result: String(formData.get("result") || "") || null,
        manOfMatch: String(formData.get("manOfMatch") || "") || null,
        status: "COMPLETED",
      },
    });
    revalidatePath("/admin/scorecards");
    redirect(`/admin/scorecards?gameId=${gameId}&saved=1`);
  }

  const games = await prisma.game.findMany({
    orderBy: { gameDate: "desc" },
    take: 20,
  });

  const selectedGame = params.gameId
    ? await prisma.game.findUnique({
        where: { id: params.gameId },
        include: {
          participations: { include: { member: { select: { id: true, name: true } } } },
          battingPerfs: { include: { member: { select: { name: true } } } },
          bowlingPerfs: { include: { member: { select: { name: true } } } },
        },
      })
    : null;

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Scorecards" title="Enter match scorecards" description="Record batting and bowling stats for each game." />

      {params.saved && (
        <div className="bg-forest-700/20 border border-forest-600/30 text-sage px-4 py-3 rounded-xl text-sm">Stats saved successfully.</div>
      )}

      {/* Game picker */}
      <Card className="space-y-3">
        <h2 className="font-display text-xl text-navy-100">Select game</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <a
              key={game.id}
              href={`/admin/scorecards?gameId=${game.id}`}
              className={`block rounded-xl border p-3 no-underline transition ${
                params.gameId === game.id
                  ? "bg-forest-700/20 border-forest-600/40 text-sage"
                  : "bg-navy-800/50 border-white/5 text-navy-300 hover:border-white/10"
              }`}
            >
              <p className="text-sm font-medium">{game.title}</p>
              <p className="text-xs mt-0.5 opacity-60">vs {game.opponent ?? "—"} · {formatDate(game.gameDate)}</p>
              {game.result && <p className="text-xs mt-1 text-sage">{game.result}</p>}
            </a>
          ))}
        </div>
      </Card>

      {selectedGame && (
        <>
          {/* Game result */}
          <Card className="space-y-4">
            <h2 className="font-display text-xl text-navy-100">Match result — {selectedGame.title}</h2>
            <form action={updateGameResult} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="gameId" value={selectedGame.id} />
              <input name="psccScore" placeholder="PSCC score (e.g. 142/6)" defaultValue={selectedGame.psccScore ?? ""} className={fieldClassName} />
              <input name="opponentScore" placeholder="Opponent score" defaultValue={selectedGame.opponentScore ?? ""} className={fieldClassName} />
              <select name="result" defaultValue={selectedGame.result ?? ""} className={fieldClassName}>
                <option value="">Result...</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
                <option value="Tied">Tied</option>
                <option value="No result">No result</option>
              </select>
              <input name="manOfMatch" placeholder="Man of the match" defaultValue={selectedGame.manOfMatch ?? ""} className={fieldClassName} />
              <div className="sm:col-span-2 lg:col-span-4">
                <SubmitButton label="Save result" pendingLabel="Saving..." />
              </div>
            </form>
          </Card>

          {/* Batting scorecard entry */}
          <Card className="space-y-4">
            <h2 className="font-display text-xl text-navy-100">Batting scorecard</h2>
            <div className="space-y-3">
              {selectedGame.participations.map((p, i) => {
                const existing = selectedGame.battingPerfs.find((b) => b.memberId === p.memberId);
                return (
                  <form key={p.memberId} action={saveScorecard} className="bg-navy-800/50 border border-white/5 rounded-xl p-3">
                    <input type="hidden" name="gameId" value={selectedGame.id} />
                    <input type="hidden" name="memberId" value={p.memberId} />
                    <input type="hidden" name="type" value="batting" />
                    <p className="text-navy-200 text-sm font-medium mb-2">{p.member.name}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                      <input name="battingOrder" placeholder="Pos" type="number" defaultValue={existing?.battingOrder ?? i + 1} className={fieldClassName} />
                      <input name="runs" placeholder="Runs" type="number" defaultValue={existing?.runs ?? 0} className={fieldClassName} />
                      <input name="balls" placeholder="Balls" type="number" defaultValue={existing?.balls ?? 0} className={fieldClassName} />
                      <input name="fours" placeholder="4s" type="number" defaultValue={existing?.fours ?? 0} className={fieldClassName} />
                      <input name="sixes" placeholder="6s" type="number" defaultValue={existing?.sixes ?? 0} className={fieldClassName} />
                      <select name="isOut" defaultValue={existing?.isOut ? "true" : "false"} className={fieldClassName}>
                        <option value="false">Not out</option>
                        <option value="true">Out</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input name="dismissal" placeholder="Dismissal (e.g. Caught, Bowled)" defaultValue={existing?.dismissal ?? ""} className={`${fieldClassName} flex-1`} />
                      <SubmitButton label="Save" pendingLabel="..." className="rounded-full bg-forest-700 px-4 py-2 text-xs font-semibold text-mint border border-forest-600" />
                    </div>
                  </form>
                );
              })}
            </div>
          </Card>

          {/* Bowling scorecard entry */}
          <Card className="space-y-4">
            <h2 className="font-display text-xl text-navy-100">Bowling scorecard</h2>
            <div className="space-y-3">
              {selectedGame.participations.map((p) => {
                const existing = selectedGame.bowlingPerfs.find((b) => b.memberId === p.memberId);
                return (
                  <form key={p.memberId} action={saveScorecard} className="bg-navy-800/50 border border-white/5 rounded-xl p-3">
                    <input type="hidden" name="gameId" value={selectedGame.id} />
                    <input type="hidden" name="memberId" value={p.memberId} />
                    <input type="hidden" name="type" value="bowling" />
                    <p className="text-navy-200 text-sm font-medium mb-2">{p.member.name}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      <input name="overs" placeholder="Overs" type="number" step="0.1" defaultValue={existing?.overs ?? 0} className={fieldClassName} />
                      <input name="maidens" placeholder="Maidens" type="number" defaultValue={existing?.maidens ?? 0} className={fieldClassName} />
                      <input name="runs" placeholder="Runs" type="number" defaultValue={existing?.runs ?? 0} className={fieldClassName} />
                      <input name="wickets" placeholder="Wickets" type="number" defaultValue={existing?.wickets ?? 0} className={fieldClassName} />
                      <input name="wides" placeholder="Wides" type="number" defaultValue={existing?.wides ?? 0} className={fieldClassName} />
                      <input name="noBalls" placeholder="No balls" type="number" defaultValue={existing?.noBalls ?? 0} className={fieldClassName} />
                    </div>
                    <div className="mt-2">
                      <SubmitButton label="Save bowling" pendingLabel="..." className="rounded-full bg-forest-700 px-4 py-2 text-xs font-semibold text-mint border border-forest-600" />
                    </div>
                  </form>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
