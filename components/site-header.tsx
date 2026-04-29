import Link from "next/link";

// Site header is now minimal - main nav is the bottom nav on mobile
// This header only shows on non-home pages
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-navy-800 px-4 py-3 border-b border-white/5">
      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="w-7 h-7 rounded-full bg-forest-700 border border-forest-600 flex items-center justify-center">
          <span className="text-mint text-[9px] font-semibold">PSCC</span>
        </div>
        <span className="text-navy-100 text-sm font-medium">Puget Sound CC</span>
      </Link>
      <Link
        href="/account/sign-in"
        className="bg-forest-700 text-mint text-xs px-3 py-1.5 rounded-lg border border-forest-600 no-underline font-medium"
      >
        Sign In
      </Link>
    </header>
  );
}

export function BottomNav({ active }: { active?: "home" | "games" | "podcast" | "account" }) {
  const items = [
    {
      key: "home",
      href: "/",
      label: "Home",
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke={active ? "#52b788" : "#8892b0"} strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      key: "games",
      href: "/account",
      label: "Portal",
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="8" r="3" stroke={active ? "#52b788" : "#8892b0"} strokeWidth="1.5"/>
          <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke={active ? "#52b788" : "#8892b0"} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      key: "podcast",
      href: "/podcast",
      label: "Podcast",
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke={active ? "#52b788" : "#8892b0"} strokeWidth="1.5"/>
          <path d="M8 7.5l5 2.5-5 2.5V7.5z" stroke={active ? "#52b788" : "#8892b0"} strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: "account",
      href: "/account/sign-in",
      label: "Sign In",
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="13" rx="2" stroke={active ? "#52b788" : "#8892b0"} strokeWidth="1.5"/>
          <path d="M7 2v4M13 2v4M3 9h14" stroke={active ? "#52b788" : "#8892b0"} strokeWidth="1.5" strokeLinecap="round"/>
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
