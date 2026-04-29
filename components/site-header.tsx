import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";

// Public header for non-account pages (leaderboard, podcast, about, contact)
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 bg-navy-800/95 backdrop-blur border-b border-white/5">
      <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
          <div className="relative w-7 h-7">
            <ClubLogo className="w-7 h-7" />
          </div>
          <span className="text-navy-100 text-sm font-semibold hidden sm:block">Puget Sound Cricket Club</span>
          <span className="text-navy-100 text-sm font-semibold sm:hidden">PSCC</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 ml-4 flex-1">
          {[
            { href: "/leaderboard", label: "Leaderboard" },
            { href: "/podcast",     label: "Podcast" },
            { href: "/about",       label: "About" },
            { href: "/contact",     label: "Contact" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="text-navy-400 hover:text-navy-100 text-xs px-3 py-1.5 rounded-lg no-underline transition hover:bg-white/5">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <Link href="/account" className="bg-forest-700 text-mint text-xs px-3 py-1.5 rounded-lg border border-forest-600 no-underline font-medium hover:bg-forest-600 transition">
            Member Portal
          </Link>
        </div>
      </div>
    </header>
  );
}

// Legacy export kept for compatibility
export function SiteHeader() {
  return <PublicHeader />;
}

export function BottomNav({ active }: { active?: "home" | "leaderboard" | "podcast" | "account" }) {
  const items = [
    {
      key: "home",
      href: "/",
      label: "Home",
      icon: (on: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke={on ? "#52b788" : "#8892b0"} strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      key: "leaderboard",
      href: "/leaderboard",
      label: "Rankings",
      icon: (on: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="10" width="3" height="7" rx="1" stroke={on ? "#52b788" : "#8892b0"} strokeWidth="1.5"/>
          <rect x="8.5" y="6" width="3" height="11" rx="1" stroke={on ? "#52b788" : "#8892b0"} strokeWidth="1.5"/>
          <rect x="14" y="3" width="3" height="14" rx="1" stroke={on ? "#52b788" : "#8892b0"} strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      key: "podcast",
      href: "/podcast",
      label: "Podcast",
      icon: (on: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke={on ? "#52b788" : "#8892b0"} strokeWidth="1.5"/>
          <path d="M8 7.5l5 2.5-5 2.5V7.5z" stroke={on ? "#52b788" : "#8892b0"} strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: "account",
      href: "/account",
      label: "Portal",
      icon: (on: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="8" r="3" stroke={on ? "#52b788" : "#8892b0"} strokeWidth="1.5"/>
          <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke={on ? "#52b788" : "#8892b0"} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy-800 border-t border-white/5 flex justify-around py-2.5 pb-4 z-30">
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <Link key={item.key} href={item.href} className="flex flex-col items-center gap-1 no-underline">
            {item.icon(isActive)}
            <span className={`text-[9px] ${isActive ? "text-sage" : "text-navy-400"}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
