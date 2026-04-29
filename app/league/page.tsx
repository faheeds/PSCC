"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicHeader, BottomNav } from "@/components/site-header";

const teams = [
  {
    id: "steelheads",
    name: "Steelheads",
    division: "Division A",
    color: "amber",
    scheduleUrl: "https://www.nwcl.org/NWCL/teamSchedule.do?teamId=1452&league=160&clubId=232",
    resultsUrl: "https://www.nwcl.org/NWCL/teamResults.do?teamId=1452&league=160&clubId=232",
  },
  {
    id: "chinooks",
    name: "Chinooks",
    division: "Division B",
    color: "blue",
    scheduleUrl: "https://www.nwcl.org/NWCL/teamSchedule.do?teamId=1464&league=161&clubId=232",
    resultsUrl: "https://www.nwcl.org/NWCL/teamResults.do?teamId=1464&league=161&clubId=232",
  },
  {
    id: "sockeyes",
    name: "Sockeyes",
    division: "Division C",
    color: "forest",
    scheduleUrl: "https://www.nwcl.org/NWCL/teamSchedule.do?teamId=1474&league=162&clubId=232",
    resultsUrl: "https://www.nwcl.org/NWCL/teamResults.do?teamId=1474&league=162&clubId=232",
  },
];

const colorMap: Record<string, string> = {
  amber:  { active: "bg-amber-500/20 text-amber-300 border-amber-500/30",  dot: "bg-amber-400",  tab: "border-amber-400" },
  blue:   { active: "bg-navy-500/30 text-navy-200 border-navy-400/30",     dot: "bg-blue-400",   tab: "border-blue-400" },
  forest: { active: "bg-forest-700/30 text-sage border-forest-600/30",     dot: "bg-sage",       tab: "border-sage" },
} as any;

export default function LeaguePage() {
  const [activeTeam, setActiveTeam] = useState("steelheads");
  const [activeView, setActiveView] = useState<"schedule" | "results">("schedule");

  const team = teams.find((t) => t.id === activeTeam)!;
  const iframeUrl = activeView === "schedule" ? team.scheduleUrl : team.resultsUrl;
  const colors = colorMap[team.color];

  return (
    <main className="min-h-screen bg-navy-900 flex flex-col">
      <PublicHeader />

      {/* Page header */}
      <div className="px-4 pt-5 pb-3 max-w-7xl mx-auto w-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-forest-400 text-xs font-semibold uppercase tracking-widest mb-1">2026 T40 Season</p>
            <h1 className="text-navy-100 text-2xl font-display font-semibold">NWCL League Hub</h1>
            <p className="text-navy-400 text-sm mt-1">Live schedules and results from NorthWest Cricket League</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-navy-800 border border-white/5 rounded-xl px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse"/>
            <span className="text-navy-300 text-xs font-medium">Live from NWCL</span>
          </div>
        </div>
      </div>

      {/* Team selector */}
      <div className="px-4 max-w-7xl mx-auto w-full">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {teams.map((t) => {
            const c = colorMap[t.color];
            const isActive = activeTeam === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTeam(t.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isActive
                    ? c.active
                    : "bg-navy-800 text-navy-400 border-white/5 hover:bg-navy-700 hover:text-navy-200"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isActive ? c.dot : "bg-navy-600"}`}/>
                <div>
                  <span className="font-semibold">PSCC {t.name}</span>
                  <span className={`ml-2 text-xs ${isActive ? "opacity-70" : "text-navy-500"}`}>{t.division}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule / Results toggle */}
      <div className="px-4 pt-3 max-w-7xl mx-auto w-full">
        <div className="flex gap-1 bg-navy-800 border border-white/5 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveView("schedule")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === "schedule"
                ? "bg-navy-700 text-navy-100 shadow-sm"
                : "text-navy-400 hover:text-navy-200"
            }`}
          >
            📅 Schedule
          </button>
          <button
            onClick={() => setActiveView("results")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === "results"
                ? "bg-navy-700 text-navy-100 shadow-sm"
                : "text-navy-400 hover:text-navy-200"
            }`}
          >
            🏏 Results
          </button>
        </div>
      </div>

      {/* iFrame */}
      <div className="flex-1 px-4 pt-3 pb-24 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-2xl overflow-hidden border border-white/10 shadow-soft" style={{ minHeight: "600px" }}>
          <iframe
            key={iframeUrl}
            src={iframeUrl}
            className="w-full"
            style={{ height: "calc(100vh - 280px)", minHeight: "600px", border: "none" }}
            title={`PSCC ${team.name} ${activeView}`}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
        <p className="text-center text-navy-600 text-xs mt-2">
          Data provided by{" "}
          <a href="https://www.nwcl.org" target="_blank" rel="noopener noreferrer" className="text-navy-400 hover:text-navy-200 no-underline transition">
            NorthWest Cricket League ↗
          </a>
        </p>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
