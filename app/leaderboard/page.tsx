import { getSeasonLeaderboard } from "@/lib/player-stats";
import { BottomNav, PublicHeader } from "@/components/site-header";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { topBatsmen, topBowlers } = await getSeasonLeaderboard();

  return (
    <main className="min-h-screen bg-navy-900 pb-24">
      <PublicHeader />

      {/* Page title */}
      <div className="px-4 pt-5 pb-2 max-w-4xl mx-auto">
        <p className="text-forest-400 text-xs font-semibold uppercase tracking-widest mb-1">2026 Season</p>
        <h1 className="text-navy-100 text-2xl font-display font-semibold">Leaderboard</h1>
        <p className="text-navy-400 text-sm mt-1">Top performers across all games this season.</p>
      </div>

      <div className="px-4 pt-4 space-y-6 max-w-4xl mx-auto">

        {/* Top Batsmen */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-sage rounded-full"/>
            <p className="text-navy-100 text-sm font-semibold">Top Batsmen</p>
            <span className="text-navy-500 text-xs">by runs</span>
          </div>
          <div className="space-y-2">
            {topBatsmen.length === 0 && (
              <div className="bg-navy-800 border border-white/5 rounded-2xl p-6 text-center">
                <p className="text-navy-500 text-sm">No batting stats recorded yet.</p>
                <p className="text-navy-600 text-xs mt-1">Stats appear once admin enters scorecards.</p>
              </div>
            )}
            {topBatsmen.map((entry, i) => (
              <div key={entry.member?.id ?? i} className="bg-navy-800 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    i === 1 ? "bg-navy-600/40 text-navy-300 border border-navy-600/40" :
                    i === 2 ? "bg-forest-700/40 text-sage border border-forest-600/40" :
                    "bg-navy-700/40 text-navy-500"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy-100 text-sm font-medium truncate">{entry.member?.name ?? "Unknown"}</p>
                  <p className="text-navy-500 text-[10px]">{entry.innings} innings · HS {entry.highScore} · {entry.fours} fours · {entry.sixes} sixes</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-mint text-lg font-bold">{entry.runs}</p>
                  <p className="text-navy-500 text-[10px]">runs</p>
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
              <div className="bg-navy-800 border border-white/5 rounded-2xl p-6 text-center">
                <p className="text-navy-500 text-sm">No bowling stats recorded yet.</p>
                <p className="text-navy-600 text-xs mt-1">Stats appear once admin enters scorecards.</p>
              </div>
            )}
            {topBowlers.map((entry, i) => (
              <div key={entry.member?.id ?? i} className="bg-navy-800 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    i === 1 ? "bg-navy-600/40 text-navy-300 border border-navy-600/40" :
                    i === 2 ? "bg-forest-700/40 text-sage border border-forest-600/40" :
                    "bg-navy-700/40 text-navy-500"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy-100 text-sm font-medium truncate">{entry.member?.name ?? "Unknown"}</p>
                  <p className="text-navy-500 text-[10px]">{entry.innings} innings · {entry.runs} runs conceded</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-amber-400 text-lg font-bold">{entry.wickets}</p>
                  <p className="text-navy-500 text-[10px]">wickets</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sign in CTA */}
        <div className="bg-gradient-to-r from-forest-700 to-navy-700 border border-forest-600/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-navy-100 text-sm font-medium">See your full stats</p>
            <p className="text-navy-400 text-xs mt-0.5">Sign in to view your personal batting & bowling stats</p>
          </div>
          <Link href="/account/sign-in" className="bg-sage text-navy-900 text-xs font-semibold px-4 py-2 rounded-xl no-underline flex-shrink-0">
            Sign In
          </Link>
        </div>

      </div>

      <BottomNav active="leaderboard" />
    </main>
  );
}
