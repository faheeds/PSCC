import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";

const upcomingGames = [
  { day: "10", month: "May", opponent: "Bellevue CC", venue: "Marymoor Park", time: "10:00 AM", format: "T20" },
  { day: "17", month: "May", opponent: "Seattle CC", venue: "Lower Woodland Park", time: "9:00 AM", format: "T40" },
  { day: "24", month: "May", opponent: "Tacoma CC", venue: "Marymoor Park", time: "10:00 AM", format: "T20" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-navy-900 pb-20">

      {/* Top Nav */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy-800 px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-forest-700 border border-forest-600 flex items-center justify-center">
            <span className="text-mint text-[9px] font-semibold">PSCC</span>
          </div>
          <span className="text-navy-100 text-sm font-medium">Puget Sound Cricket Club</span>
        </div>
        <Link
          href="/account/sign-in"
          className="bg-forest-700 text-mint text-xs px-3 py-1.5 rounded-lg border border-forest-600 no-underline font-medium"
        >
          Sign In
        </Link>
      </header>

      {/* Photo Carousel Hero */}
      <section className="relative h-52 overflow-hidden bg-gradient-to-br from-forest-700 via-navy-900 to-navy-800">
        {/* Cricket wicket graphic */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <svg width="140" height="100" viewBox="0 0 140 100" fill="none">
            <rect x="30" y="10" width="5" height="70" rx="2.5" fill="#ccd6f6"/>
            <rect x="67" y="10" width="5" height="70" rx="2.5" fill="#ccd6f6"/>
            <rect x="105" y="10" width="5" height="70" rx="2.5" fill="#ccd6f6"/>
            <rect x="25" y="8" width="20" height="5" rx="2.5" fill="#ccd6f6"/>
            <rect x="62" y="8" width="20" height="5" rx="2.5" fill="#ccd6f6"/>
            <ellipse cx="70" cy="86" rx="58" ry="7" fill="#52b788" opacity="0.4"/>
          </svg>
        </div>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/10 via-transparent to-navy-900/80"/>
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="inline-block bg-forest-700/60 border border-forest-600/50 rounded-full px-2.5 py-0.5 text-mint text-[10px] font-medium mb-1">
            Match Day
          </span>
          <p className="text-navy-100 text-sm font-medium">PSCC vs Eastside CC — T20</p>
          <p className="text-navy-300 text-xs mt-0.5">Apr 20, 2026 · Marymoor Park</p>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 right-4 flex gap-1">
          <div className="w-4 h-1.5 rounded-full bg-sage"/>
          <div className="w-1.5 h-1.5 rounded-full bg-white/30"/>
          <div className="w-1.5 h-1.5 rounded-full bg-white/30"/>
          <div className="w-1.5 h-1.5 rounded-full bg-white/30"/>
        </div>
      </section>

      <div className="px-4 pt-4 space-y-4">

        {/* Next Practice */}
        <div>
          <p className="text-[10px] text-navy-400 uppercase tracking-widest mb-2 font-medium">Next Practice</p>
          <div className="bg-navy-800 border border-forest-600/30 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="bg-forest-700 rounded-xl px-3 py-2.5 text-center flex-shrink-0">
              <p className="text-mint text-xl font-semibold leading-none">7</p>
              <p className="text-forest-300 text-[9px] uppercase tracking-wider mt-1">May</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-navy-100 text-sm font-medium">Wednesday Session</p>
              <p className="text-navy-400 text-xs mt-0.5">6:00 PM · Marymoor Park, Redmond</p>
            </div>
            <Link
              href="/account"
              className="bg-forest-700 border border-forest-600 rounded-full px-3 py-1.5 text-mint text-xs font-medium no-underline flex-shrink-0"
            >
              Check In
            </Link>
          </div>
        </div>

        {/* Upcoming Games */}
        <div>
          <p className="text-[10px] text-navy-400 uppercase tracking-widest mb-2 font-medium">Upcoming Games</p>
          <div className="space-y-2">
            {upcomingGames.map((game) => (
              <div key={game.opponent} className="bg-navy-800 border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                <div className="bg-navy-700/60 rounded-xl px-2.5 py-2 text-center flex-shrink-0 min-w-[44px]">
                  <p className="text-navy-100 text-base font-semibold leading-none">{game.day}</p>
                  <p className="text-navy-400 text-[9px] mt-0.5">{game.month}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy-100 text-sm font-medium">PSCC vs {game.opponent}</p>
                  <p className="text-navy-400 text-xs mt-0.5">{game.time} · {game.venue}</p>
                </div>
                <span className={`text-[9px] px-2 py-1 rounded-full font-medium border flex-shrink-0 ${
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
        <div className="bg-gradient-to-r from-forest-700 to-navy-700 border border-forest-600/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-navy-100 text-sm font-medium">Want to play?</p>
            <p className="text-navy-300 text-xs mt-0.5">Join Puget Sound Cricket Club</p>
          </div>
          <Link
            href="/contact"
            className="bg-sage text-navy-900 text-xs font-semibold px-3 py-2 rounded-xl no-underline flex-shrink-0"
          >
            Contact Us
          </Link>
        </div>

      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-navy-800 border-t border-white/5 flex justify-around py-2.5 pb-4 z-30">
        <Link href="/" className="flex flex-col items-center gap-1 no-underline">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="#52b788" strokeWidth="1.5"/>
          </svg>
          <span className="text-[9px] text-sage">Home</span>
        </Link>
        <Link href="/account" className="flex flex-col items-center gap-1 no-underline">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="13" rx="2" stroke="#8892b0" strokeWidth="1.5"/>
            <path d="M7 2v4M13 2v4M3 9h14" stroke="#8892b0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-[9px] text-navy-400">Games</span>
        </Link>
        <Link href="/podcast" className="flex flex-col items-center gap-1 no-underline">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="#8892b0" strokeWidth="1.5"/>
            <path d="M8 7.5l5 2.5-5 2.5V7.5z" stroke="#8892b0" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span className="text-[9px] text-navy-400">Podcast</span>
        </Link>
        <Link href="/account/sign-in" className="flex flex-col items-center gap-1 no-underline">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="8" r="3" stroke="#8892b0" strokeWidth="1.5"/>
            <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#8892b0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-[9px] text-navy-400">Sign In</span>
        </Link>
      </nav>

    </main>
  );
}
