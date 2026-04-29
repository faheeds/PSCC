import Link from "next/link";
import Image from "next/image";
import { ClubLogo } from "@/components/club-logo";
import { BottomNav } from "@/components/site-header";

const upcomingGames = [
  { day: "10", month: "May", opponent: "Bellevue CC", venue: "North Robinswood Cricket Field", time: "10:00 AM", format: "T20" },
  { day: "17", month: "May", opponent: "Seattle CC", venue: "Lower Woodland Park", time: "9:00 AM", format: "T40" },
  { day: "24", month: "May", opponent: "Tacoma CC", venue: "North Robinswood Cricket Field", time: "10:00 AM", format: "T20" },
];

const memberActions = [
  {
    num: "01",
    title: "Practice Check-In",
    body: "Show up, tap check in, and claim your spot in the batting order. GPS-verified — only works when you're at North Robinswood.",
    href: "/account",
    label: "Open check-in",
    color: "forest",
  },
  {
    num: "02",
    title: "Dues & Payments",
    body: "View every charge — season fees, match fees, kit — and settle your balance in seconds. No chasing, no spreadsheets.",
    href: "/account",
    label: "View balance",
    color: "navy",
  },
  {
    num: "03",
    title: "Share Media",
    body: "Got a cracking cover drive on camera? Send it straight to the club social queue. Admin reviews and it goes on the 'gram.",
    href: "/account",
    label: "Upload media",
    color: "forest",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-navy-900">

      {/* ─── DESKTOP NAV (hidden on mobile) ─── */}
      <header className="hidden md:flex sticky top-0 z-30 items-center justify-between bg-navy-800/95 backdrop-blur px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex-shrink-0">
            <ClubLogo className="w-9 h-9" priority />
          </div>
          <div>
            <span className="text-navy-100 text-base font-semibold">Puget Sound Cricket Club</span>
            <span className="ml-2 text-navy-400 text-xs">Seattle, WA</span>
          </div>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/about" className="text-navy-300 text-sm hover:text-navy-100 no-underline transition">About</Link>
          <Link href="/podcast" className="text-navy-300 text-sm hover:text-navy-100 no-underline transition">Podcast</Link>
          <Link href="/contact" className="text-navy-300 text-sm hover:text-navy-100 no-underline transition">Contact</Link>
          <Link href="/admin/dashboard" className="text-navy-400 text-sm hover:text-navy-200 no-underline transition border-l border-white/10 pl-6">Admin Portal</Link>
          <Link href="/account/sign-in" className="bg-forest-700 text-mint text-sm px-4 py-2 rounded-lg border border-forest-600 no-underline font-medium hover:bg-forest-600 transition">
            Member Portal
          </Link>
        </nav>
      </header>

      {/* ─── MOBILE NAV (hidden on desktop) ─── */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-navy-800 px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 flex-shrink-0">
            <ClubLogo className="w-7 h-7" priority />
          </div>
          <span className="text-navy-100 text-sm font-medium">Puget Sound CC</span>
        </div>
        <Link href="/account/sign-in" className="bg-forest-700 text-mint text-xs px-3 py-1.5 rounded-lg border border-forest-600 no-underline font-medium">
          Sign In
        </Link>
      </header>

      {/* ─── DESKTOP HERO ─── */}
      <section className="hidden md:block relative overflow-hidden">
        {/* Rich gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-forest-900"/>
        {/* Decorative rings */}
        <div className="absolute -right-32 -top-32 w-[600px] h-[600px] rounded-full border border-white/5"/>
        <div className="absolute -right-16 -top-16 w-[400px] h-[400px] rounded-full border border-forest-600/10"/>
        <div className="absolute right-32 top-32 w-[200px] h-[200px] rounded-full bg-forest-700/10"/>
        
        <div className="relative max-w-7xl mx-auto px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-forest-700/30 border border-forest-600/40 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-sage animate-pulse"/>
              <span className="text-mint text-sm font-medium">Seattle's Premier Cricket Club</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-display text-navy-100 leading-tight">
                Play. Connect.<br/>
                <span className="text-sage">Belong to PSCC.</span>
              </h1>
              <p className="text-navy-300 text-lg leading-relaxed max-w-lg">
                Practice check-in, dues, team updates, and club communications — everything Puget Sound Cricket Club members need in one place.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/account" className="bg-forest-700 text-mint px-6 py-3 rounded-xl border border-forest-600 no-underline font-semibold hover:bg-forest-600 transition text-base">
                Member Portal
              </Link>
              <Link href="/admin/login" className="bg-white/5 text-navy-200 px-6 py-3 rounded-xl border border-white/10 no-underline font-semibold hover:bg-white/10 transition text-base">
                Admin Portal
              </Link>
            </div>
            {/* Next practice pill */}
            <div className="inline-flex items-center gap-3 bg-navy-800/80 border border-forest-600/30 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 bg-forest-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" stroke="#74c69d" strokeWidth="1.3"/>
                  <path d="M5 1.5v3M11 1.5v3M2 7h12" stroke="#74c69d" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-navy-400 uppercase tracking-wider">Next Practice</p>
                <p className="text-navy-100 text-sm font-medium">Wednesday, May 7 · 6:00 PM · North Robinswood Cricket Field</p>
              </div>
              <Link href="/account" className="ml-2 bg-forest-700 border border-forest-600 rounded-full px-3 py-1 text-mint text-xs font-medium no-underline hover:bg-forest-600 transition">
                Check In
              </Link>
            </div>
          </div>

          {/* Club logo + stats on right */}
          <div className="flex flex-col items-center gap-8">
            <div className="relative w-64 h-64 lg:w-80 lg:h-80">
              <div className="absolute inset-0 bg-forest-700/20 rounded-full blur-3xl"/>
              <ClubLogo className="w-full h-full relative z-10" priority />
            </div>
            {/* Stats strip */}
            <div className="w-full grid grid-cols-3 gap-3">
              {[
                { val: "T20/T40", label: "Formats" },
                { val: "Wed", label: "Practice day" },
                { val: "2014", label: "Est." },
              ].map((s) => (
                <div key={s.label} className="bg-navy-800 border border-white/5 rounded-xl px-3 py-4 text-center">
                  <p className="text-sage text-lg font-semibold">{s.val}</p>
                  <p className="text-navy-400 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MOBILE HERO CAROUSEL ─── */}
      <section className="md:hidden relative h-52 overflow-hidden bg-gradient-to-br from-forest-700 via-navy-900 to-navy-800">
        <div className="absolute inset-0 flex items-center justify-center opacity-8">
          <div className="relative w-36 h-36">
            <ClubLogo className="w-36 h-36" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/10 via-transparent to-navy-900/85"/>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="inline-block bg-forest-700/60 border border-forest-600/50 rounded-full px-2.5 py-0.5 text-mint text-[10px] font-medium mb-1">
            Match Day
          </span>
          <p className="text-navy-100 text-sm font-medium">PSCC vs Eastside CC — T20</p>
          <p className="text-navy-400 text-xs mt-0.5">Apr 20, 2026 · North Robinswood Cricket Field</p>
        </div>
        <div className="absolute bottom-4 right-4 flex gap-1.5 items-center">
          <div className="w-4 h-1.5 rounded-full bg-sage"/>
          <div className="w-1.5 h-1.5 rounded-full bg-white/25"/>
          <div className="w-1.5 h-1.5 rounded-full bg-white/25"/>
        </div>
      </section>

      {/* ─── MOBILE QUICK ACTIONS ─── */}
      <div className="md:hidden pb-24">

        {/* Stats strip */}
        <div className="flex border-b border-white/5">
          <div className="flex-1 py-3 text-center border-r border-white/5">
            <p className="text-sage text-base font-bold leading-none">T20/T40</p>
            <p className="text-navy-500 text-[10px] mt-1">Formats</p>
          </div>
          <div className="flex-1 py-3 text-center border-r border-white/5">
            <p className="text-sage text-base font-bold leading-none">Wed</p>
            <p className="text-navy-500 text-[10px] mt-1">Practice</p>
          </div>
          <div className="flex-1 py-3 text-center">
            <p className="text-sage text-base font-bold leading-none">2014</p>
            <p className="text-navy-500 text-[10px] mt-1">Est.</p>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">

          {/* Next Practice - sporty card */}
          <div className="bg-gradient-to-br from-forest-800 to-navy-800 border border-forest-600/30 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-8">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <rect x="8" y="4" width="6" height="44" rx="3" fill="#ccd6f6"/>
                <rect x="23" y="4" width="6" height="44" rx="3" fill="#ccd6f6"/>
                <rect x="38" y="4" width="6" height="44" rx="3" fill="#ccd6f6"/>
                <rect x="5" y="2" width="16" height="6" rx="3" fill="#ccd6f6"/>
                <rect x="20" y="2" width="16" height="6" rx="3" fill="#ccd6f6"/>
              </svg>
            </div>
            <p className="text-forest-300 text-[10px] font-semibold uppercase tracking-widest mb-2">Next Practice</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-forest-700/60 border border-forest-500/40 rounded-xl px-3 py-2 text-center flex-shrink-0">
                <p className="text-mint text-2xl font-bold leading-none">7</p>
                <p className="text-forest-400 text-[9px] uppercase tracking-wide">MAY</p>
              </div>
              <div>
                <p className="text-navy-100 text-sm font-semibold">Wednesday Session</p>
                <p className="text-navy-400 text-xs mt-0.5">6:00 PM · North Robinswood</p>
              </div>
            </div>
            <Link href="/account" className="flex items-center justify-center w-full bg-forest-700 border border-forest-500/50 rounded-xl py-2.5 text-mint text-sm font-semibold no-underline">
              Check In Now →
            </Link>
          </div>

          {/* 2x2 Quick action grid */}
          <div>
            <p className="section-label">Quick actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/account" className="bg-navy-800 border border-white/5 rounded-2xl p-3.5 no-underline hover:border-forest-600/30 transition">
                <div className="w-8 h-8 bg-forest-700/40 rounded-xl flex items-center justify-center mb-2.5">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#52b788" strokeWidth="1.3"/><path d="M5 8l2 2 4-4" stroke="#52b788" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="text-navy-100 text-sm font-semibold">Check In</p>
                <p className="text-navy-500 text-[10px] mt-0.5">Lock your batting spot</p>
              </Link>
              <Link href="/account" className="bg-navy-800 border border-white/5 rounded-2xl p-3.5 no-underline hover:border-amber-600/30 transition">
                <div className="w-8 h-8 bg-amber-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="#f59e0b" strokeWidth="1.3"/><path d="M5 7.5h6M5 10h4" stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <p className="text-navy-100 text-sm font-semibold">Dues</p>
                <p className="text-navy-500 text-[10px] mt-0.5">View & pay balance</p>
              </Link>
              <Link href="/account/stats" className="bg-navy-800 border border-white/5 rounded-2xl p-3.5 no-underline hover:border-blue-600/30 transition">
                <div className="w-8 h-8 bg-blue-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="8" width="3" height="6" rx="1" stroke="#60a5fa" strokeWidth="1.3"/><rect x="6.5" y="5" width="3" height="9" rx="1" stroke="#60a5fa" strokeWidth="1.3"/><rect x="11" y="2" width="3" height="12" rx="1" stroke="#60a5fa" strokeWidth="1.3"/></svg>
                </div>
                <p className="text-navy-100 text-sm font-semibold">My Stats</p>
                <p className="text-navy-500 text-[10px] mt-0.5">Batting & bowling</p>
              </Link>
              <Link href="/league" className="bg-navy-800 border border-white/5 rounded-2xl p-3.5 no-underline hover:border-sage/30 transition">
                <div className="w-8 h-8 bg-forest-700/20 rounded-xl flex items-center justify-center mb-2.5">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#52b788" strokeWidth="1.3"/><path d="M5.5 8c0-1.38 1.12-2.5 2.5-2.5S10.5 6.62 10.5 8" stroke="#52b788" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="8" r="1" fill="#52b788"/></svg>
                </div>
                <p className="text-navy-100 text-sm font-semibold">League</p>
                <p className="text-navy-500 text-[10px] mt-0.5">NWCL schedule</p>
              </Link>
            </div>
          </div>

          {/* Upcoming Games */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="section-label mb-0">Upcoming Games</p>
              <Link href="/league" className="text-sage text-[10px] no-underline">View all →</Link>
            </div>
            <div className="space-y-2">
              {upcomingGames.map((game) => (
                <div key={game.opponent} className="bg-navy-800 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                  <div className="bg-navy-700/60 rounded-lg w-10 py-1.5 text-center flex-shrink-0">
                    <p className="text-navy-100 text-sm font-bold leading-none">{game.day}</p>
                    <p className="text-navy-500 text-[9px] mt-0.5">{game.month}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-navy-100 text-xs font-semibold">PSCC vs {game.opponent}</p>
                    <p className="text-navy-500 text-[10px] mt-0.5">{game.time} · {game.venue.split(",")[0]}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-1 rounded-full font-semibold border flex-shrink-0 ${
                    game.format === "T20"
                      ? "bg-forest-700/30 text-sage border-forest-600/40"
                      : "bg-navy-600/30 text-navy-300 border-navy-600/40"
                  }`}>
                    {game.format}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Join Banner */}
          <div className="bg-gradient-to-r from-forest-800 via-forest-700 to-navy-800 border border-forest-600/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-navy-100 text-sm font-semibold">Want to play?</p>
              <p className="text-navy-400 text-xs mt-0.5">Join Puget Sound Cricket Club</p>
            </div>
            <Link href="/contact" className="bg-sage text-navy-900 text-xs font-bold px-4 py-2 rounded-xl no-underline flex-shrink-0">
              Join Us
            </Link>
          </div>

        </div>
      </div>

            {/* ─── DESKTOP MEMBER ACTIONS ─── */}
      <section className="hidden md:block bg-surface-50 py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <p className="text-forest-600 text-sm font-semibold uppercase tracking-widest mb-3">Member Portal</p>
            <h2 className="text-4xl font-display text-navy-900">Your club. Your game. Your stats.</h2>
            <p className="text-navy-500 mt-3 text-lg max-w-xl mx-auto">Everything a PSCC cricketer needs — from checking in at the crease to tracking your batting average.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {memberActions.map((action) => (
              <div key={action.title} className="bg-white rounded-2xl border border-surface-100 p-6 shadow-card hover:-translate-y-1 hover:shadow-soft transition-all duration-200">
                <p className="text-3xl font-display text-surface-200 mb-4">{action.num}</p>
                <h3 className="text-xl font-semibold text-navy-900 mb-2">{action.title}</h3>
                <p className="text-navy-500 text-sm leading-relaxed mb-6">{action.body}</p>
                <Link href={action.href} className="inline-flex items-center gap-1 text-forest-700 text-sm font-semibold no-underline hover:text-forest-600 transition">
                  {action.label}
                  <span>→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DESKTOP UPCOMING GAMES ─── */}
      <section className="hidden md:block bg-navy-800 py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sage text-sm font-semibold uppercase tracking-widest mb-2">Schedule</p>
              <h2 className="text-3xl font-display text-navy-100">Upcoming Games</h2>
            </div>
            <Link href="/account" className="text-sage text-sm font-medium no-underline hover:text-mint transition">View all →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {upcomingGames.map((game) => (
              <div key={game.opponent} className="bg-navy-700/50 border border-white/5 rounded-2xl p-5 hover:bg-navy-700 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-navy-600 rounded-xl px-3 py-2.5 text-center">
                    <p className="text-navy-100 text-2xl font-bold leading-none">{game.day}</p>
                    <p className="text-navy-400 text-xs mt-1">{game.month}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    game.format === "T20"
                      ? "bg-forest-700/40 text-sage border border-forest-600/40"
                      : "bg-navy-600/60 text-navy-300 border border-navy-500/40"
                  }`}>
                    {game.format}
                  </span>
                </div>
                <p className="text-navy-100 font-semibold">PSCC vs {game.opponent}</p>
                <p className="text-navy-400 text-sm mt-1">{game.time}</p>
                <p className="text-navy-400 text-sm">{game.venue}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DESKTOP NEXT PRACTICE BANNER ─── */}
      <section className="hidden md:block bg-gradient-to-r from-forest-800 via-forest-700 to-navy-800 py-12">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-forest-600/40 border border-forest-500/40 rounded-2xl flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="5" width="22" height="19" rx="3" stroke="#74c69d" strokeWidth="1.8"/>
                <path d="M9 2.5v5M19 2.5v5M3 12h22" stroke="#74c69d" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="9" cy="18" r="2" fill="#52b788"/>
                <circle cx="14" cy="18" r="2" fill="#52b788"/>
              </svg>
            </div>
            <div>
              <p className="text-forest-200 text-sm uppercase tracking-widest font-semibold mb-1">Next Practice</p>
              <p className="text-white text-2xl font-display">Wednesday, May 7 · 6:00 PM</p>
              <p className="text-forest-200 mt-0.5">North Robinswood Cricket Field, Bellevue WA</p>
            </div>
          </div>
          <Link href="/account" className="bg-white text-forest-800 px-6 py-3 rounded-xl font-bold text-base no-underline hover:bg-forest-50 transition">
            Check In Now
          </Link>
        </div>
      </section>

      {/* ─── DESKTOP FOOTER ─── */}
      <footer className="hidden md:block bg-navy-900 border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <ClubLogo className="w-8 h-8" />
            </div>
            <span className="text-navy-300 text-sm">© 2026 Puget Sound Cricket Club</span>
          </div>
          <div className="flex gap-6">
            <Link href="/about" className="text-navy-400 text-sm no-underline hover:text-navy-200 transition">About</Link>
            <Link href="/podcast" className="text-navy-400 text-sm no-underline hover:text-navy-200 transition">Podcast</Link>
            <Link href="/contact" className="text-navy-400 text-sm no-underline hover:text-navy-200 transition">Contact</Link>
            <Link href="/admin/dashboard" className="text-navy-500 text-sm no-underline hover:text-navy-300 transition">Admin</Link>
          </div>
        </div>
      </footer>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <BottomNav active="home" />

    </main>
  );
}

