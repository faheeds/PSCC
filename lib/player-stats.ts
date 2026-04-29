import { prisma } from "@/lib/db";

export async function getMemberSeasonStats(memberId: string) {
  const [batting, bowling, games, checkIns] = await Promise.all([
    prisma.battingPerformance.findMany({ where: { memberId } }),
    prisma.bowlingPerformance.findMany({ where: { memberId } }),
    prisma.gameParticipation.count({ where: { memberId } }),
    prisma.practiceCheckIn.count({ where: { memberId } }),
  ]);

  // Batting stats
  const totalRuns = batting.reduce((s, b) => s + b.runs, 0);
  const totalBalls = batting.reduce((s, b) => s + b.balls, 0);
  const totalInnings = batting.length;
  const timesOut = batting.filter((b) => b.isOut).length;
  const highScore = batting.length ? Math.max(...batting.map((b) => b.runs)) : 0;
  const battingAvg = timesOut > 0 ? totalRuns / timesOut : totalRuns;
  const strikeRate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
  const fifties = batting.filter((b) => b.runs >= 50 && b.runs < 100).length;
  const hundreds = batting.filter((b) => b.runs >= 100).length;
  const totalFours = batting.reduce((s, b) => s + b.fours, 0);
  const totalSixes = batting.reduce((s, b) => s + b.sixes, 0);

  // Bowling stats
  const totalWickets = bowling.reduce((s, b) => s + b.wickets, 0);
  const totalOvers = bowling.reduce((s, b) => s + b.overs, 0);
  const totalRunsConceded = bowling.reduce((s, b) => s + b.runs, 0);
  const economy = totalOvers > 0 ? totalRunsConceded / totalOvers : 0;
  const bowlingAvg = totalWickets > 0 ? totalRunsConceded / totalWickets : 0;
  const bestBowling = bowling.length
    ? bowling.reduce((best, b) =>
        b.wickets > best.wickets || (b.wickets === best.wickets && b.runs < best.runs)
          ? b
          : best
      )
    : null;

  return {
    batting: {
      innings: totalInnings,
      runs: totalRuns,
      balls: totalBalls,
      average: Number(battingAvg.toFixed(2)),
      strikeRate: Number(strikeRate.toFixed(2)),
      highScore,
      fifties,
      hundreds,
      fours: totalFours,
      sixes: totalSixes,
      timesOut,
    },
    bowling: {
      innings: bowling.length,
      overs: Number(totalOvers.toFixed(1)),
      wickets: totalWickets,
      runs: totalRunsConceded,
      economy: Number(economy.toFixed(2)),
      average: Number(bowlingAvg.toFixed(2)),
      bestWickets: bestBowling?.wickets ?? 0,
      bestRuns: bestBowling?.runs ?? 0,
    },
    games,
    practiceCheckIns: checkIns,
  };
}

export async function getSeasonLeaderboard() {
  const [battingAgg, bowlingAgg] = await Promise.all([
    prisma.battingPerformance.groupBy({
      by: ["memberId"],
      _sum: { runs: true, fours: true, sixes: true },
      _max: { runs: true },
      _count: { id: true },
      orderBy: { _sum: { runs: "desc" } },
      take: 10,
    }),
    prisma.bowlingPerformance.groupBy({
      by: ["memberId"],
      _sum: { wickets: true, runs: true },
      _count: { id: true },
      orderBy: { _sum: { wickets: "desc" } },
      take: 10,
    }),
  ]);

  const memberIds = [...new Set([
    ...battingAgg.map((b) => b.memberId),
    ...bowlingAgg.map((b) => b.memberId),
  ])];

  const members = await prisma.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, t20Team: true, t40Team: true, playerRole: true },
  });

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));

  const topBatsmen = battingAgg.map((b) => ({
    member: memberMap[b.memberId],
    runs: b._sum.runs ?? 0,
    innings: b._count.id,
    highScore: b._max.runs ?? 0,
    fours: b._sum.fours ?? 0,
    sixes: b._sum.sixes ?? 0,
  }));

  const topBowlers = bowlingAgg.map((b) => ({
    member: memberMap[b.memberId],
    wickets: b._sum.wickets ?? 0,
    innings: b._count.id,
    runs: b._sum.runs ?? 0,
  }));

  return { topBatsmen, topBowlers };
}
