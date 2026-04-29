import { requireMember } from "@/lib/member-auth";
import { getMemberSeasonStats } from "@/lib/player-stats";
import { prisma } from "@/lib/db";
import { BottomNav } from "@/components/site-header";
import { ClubLogo } from "@/components/club-logo";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MemberStatsPage() {
  const session = await requireMember();
  const memberId = session.user?.memberId;

  if (!memberId) return null;

  const [member, stats, recentBatting, recentBowling] = await Promise.all([
    prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, playerRole: true, battingStyle: true, bowlingStyle: true, t20Team: true, t40Team: true, memberSince: true },
    }),
    getMemberSeasonStats(memberId),
    prisma.battingPerformance.findMany({
      where: { memberId },
      include: { game: { select: { title: true, gameDate: true, opponent: true, result: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.bowlingPerformance.findMany({
      where: { memberId },
      include: { game: { select: { title: true, gameDate: true, opponent: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!member) return null;

  const initials = member.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-navy-900 pb-24">

      {/* Header */}
      <header className="bg-navy-800 border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link href="/account" className="text-navy-400 text-sm no-underline">←</Link>
        <div className="flex-1">
          <p className="text-navy-100 text-sm font-semibold">My Stats</p>
          <p className="text-navy-400 text-[10px]">2026 season</p>
        </div>
        <Link href="/leaderboard" className="text-sage text-xs no-underline">Leaderboard →</Link>
      </header>

      <div className="px-4 pt-5 space-y-5">

        {/* Player card */}
        <div className="bg-gradient-to-br from-navy-800 via-navy-800 to-forest-900 border border-forest-600/20 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-forest-700 border-2 border-forest-500 flex items-center justify-center">
              <span className="text-mint text-lg font-bold">{initials}</span>
            </div>
            <div className="flex-1">
              <p className="text-navy-100 text-base font-semibold">{member.name}</p>
              <p className="text-navy-400 text-xs mt-0.5">
                {member.playerRole?.replace(/_/g, " ") ?? "Player"}
                {member.t20Team ? ` · ${member.t20Team}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-mint text-2xl font-bold">{stats.games}</p>
              <p className="text-navy-500 text-[10px]">games</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-navy-900/40 rounded-xl p-2.5 text-center">
              <p className="text-sage text-base font-bold">{stats.batting.runs}</p>
              <p className="text-navy-500 text-[9px] mt-0.5">runs</p>
            </div>
            <div className="bg-navy-900/40 rounded-xl p-2.5 text-center">
              <p className="text-amber-400 text-base font-bold">{stats.bowling.wickets}</p>
              <p className="text-navy-500 text-[9px] mt-0.5">wickets</p>
            </div>
            <div className="bg-navy-900/40 rounded-xl p-2.5 text-center">
              <p className="text-navy-200 text-base font-bold">{stats.practiceCheckIns}</p>
              <p className="text-navy-500 text-[9px] mt-0.5">practices</p>
            </div>
          </div>
        </div>

        {/* Batting stats */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-sage rounded-full"/>
            <p className="text-navy-100 text-sm font-semibold">Batting</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Average", value: stats.batting.average },
              { label: "Strike rate", value: stats.batting.strikeRate },
              { label: "High score", value: stats.batting.highScore },
              { label: "Innings", value: stats.batting.innings },
              { label: "Fifties", value: stats.batting.fifties },
              { label: "Hundreds", value: stats.batting.hundreds },
            ].map((s) => (
              <div key={s.label} className="bg-navy-800 border border-white/5 rounded-xl p-3 text-center">
                <p className="text-navy-100 text-base font-semibold">{s.value}</p>
                <p className="text-navy-500 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bowling stats */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-amber-400 rounded-full"/>
            <p className="text-navy-100 text-sm font-semibold">Bowling</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Wickets", value: stats.bowling.wickets },
              { label: "Economy", value: stats.bowling.economy },
              { label: "Average", value: stats.bowling.average },
              { label: "Overs", value: stats.bowling.overs },
              { label: "Best", value: `${stats.bowling.bestWickets}/${stats.bowling.bestRuns}` },
              { label: "Innings", value: stats.bowling.innings },
            ].map((s) => (
              <div key={s.label} className="bg-navy-800 border border-white/5 rounded-xl p-3 text-center">
                <p className="text-navy-100 text-base font-semibold">{s.value}</p>
                <p className="text-navy-500 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent batting */}
        {recentBatting.length > 0 && (
          <div>
            <p className="text-[10px] text-navy-500 uppercase tracking-widest font-medium mb-2">Recent innings</p>
            <div className="space-y-1.5">
              {recentBatting.map((b) => (
                <div key={b.id} className="bg-navy-800 border border-white/5 rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-navy-200 text-xs font-medium truncate">vs {b.game.opponent ?? b.game.title}</p>
                    <p className="text-navy-500 text-[10px]">{b.balls} balls · {b.isOut ? b.dismissal ?? "out" : "not out"}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${b.runs >= 50 ? "text-amber-400" : "text-navy-100"}`}>
                      {b.runs}{!b.isOut ? "*" : ""}
                    </p>
                    {b.game.result && (
                      <p className={`text-[10px] ${b.game.result === "Won" ? "text-sage" : b.game.result === "Lost" ? "text-red-400" : "text-navy-500"}`}>
                        {b.game.result}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentBowling.length > 0 && (
          <div>
            <p className="text-[10px] text-navy-500 uppercase tracking-widest font-medium mb-2">Recent bowling</p>
            <div className="space-y-1.5">
              {recentBowling.map((b) => (
                <div key={b.id} className="bg-navy-800 border border-white/5 rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-navy-200 text-xs font-medium truncate">vs {b.game.opponent ?? b.game.title}</p>
                    <p className="text-navy-500 text-[10px]">{b.overs} overs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 text-sm font-bold">{b.wickets}/{b.runs}</p>
                    <p className="text-navy-500 text-[10px]">wkts/runs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <BottomNav active="account" />
    </main>
  );
}
