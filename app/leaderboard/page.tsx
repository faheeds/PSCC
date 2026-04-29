import { getSeasonLeaderboard } from "@/lib/player-stats";
import { BottomNav } from "@/components/site-header";
import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { topBatsmen, topBowlers } = await getSeasonLeaderboard();

  return (
    <main className="min-h-screen bg-navy-900 pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-navy-800 border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="no-underline">
          <div className="relative w-7 h-7"><ClubLogo className="w-7 h-7" /></div>
        </Link>
        <div className="flex-1">
          <p className="text-navy-100 text-sm font-semibold">Season Leaderboard</p>
          <p className="text-navy-400 text-[10px]">2026 season</p>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-6">

        {/* Top Batsmen */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-sage rounded-full"/>
            <p className="text-navy-100 text-sm font-semibold">Top Batsmen</p>
            <span className="text-navy-500 text-xs">by runs</span>
          </div>
          <div className="space-y-2">
            {topBatsmen.length === 0 && (
              <p className="text-navy-500 text-sm">No batting stats recorded yet.</p>
            )}
            {topBatsmen.map((entry, i) => (
              <div key={entry.member?.id ?? i} className="bg-navy-800 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i === 0 ? "bg-amber-500/20 text-amber-400" :
                    i === 1 ? "bg-navy-600/40 text-navy-300" :
                    i === 2 ? "bg-forest-700/40 text-sage" :
                    "bg-navy-700/40 text-navy-500"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy-100 text-sm font-medium truncate">{entry.member?.name ?? "Unknown"}</p>
                  <p className="text-navy-500 text-[10px]">{entry.innings} innings · HS {entry.highScore}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-mint text-lg font-bold">{entry.runs}</p>
                  <p className="text-navy-500 text-[10px]">runs</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-navy-300 text-xs">{entry.fours} × 4s</p>
                  <p className="text-navy-300 text-xs">{entry.sixes} × 6s</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Bowlers */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-amber-400 rounded-full"/>
            <p className="text-navy-100 text-sm font-semibold">Top Bowlers</p>
            <span className="text-navy-500 text-xs">by wickets</span>
          </div>
          <div className="space-y-2">
            {topBowlers.length === 0 && (
              <p className="text-navy-500 text-sm">No bowling stats recorded yet.</p>
            )}
            {topBowlers.map((entry, i) => (
              <div key={entry.member?.id ?? i} className="bg-navy-800 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i === 0 ? "bg-amber-500/20 text-amber-400" :
                    i === 1 ? "bg-navy-600/40 text-navy-300" :
                    i === 2 ? "bg-forest-700/40 text-sage" :
                    "bg-navy-700/40 text-navy-500"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy-100 text-sm font-medium truncate">{entry.member?.name ?? "Unknown"}</p>
                  <p className="text-navy-500 text-[10px]">{entry.innings} innings</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-amber-400 text-lg font-bold">{entry.wickets}</p>
                  <p className="text-navy-500 text-[10px]">wickets</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-navy-300 text-xs">{entry.runs} runs</p>
                  <p className="text-navy-300 text-xs">conceded</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-forest-700 to-navy-700 border border-forest-600/30 rounded-2xl p-4 text-center">
          <p className="text-navy-100 text-sm font-medium mb-1">See your full stats</p>
          <p className="text-navy-400 text-xs mb-3">Sign in to view your batting average, strike rate and more</p>
          <Link href="/account/sign-in" className="bg-sage text-navy-900 text-xs font-semibold px-4 py-2 rounded-xl no-underline">
            Sign In
          </Link>
        </div>

      </div>

      <BottomNav active="leaderboard" />
    </main>
  );
}
