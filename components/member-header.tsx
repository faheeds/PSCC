"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navLinks = [
  { href: "/account",       label: "Portal" },
  { href: "/league",        label: "🏏 League" },
  { href: "/account/stats", label: "My Stats" },
  { href: "/leaderboard",   label: "Leaderboard" },
  { href: "/podcast",       label: "Podcast" },
  { href: "/about",         label: "About" },
  { href: "/contact",       label: "Contact" },
];

export function MemberHeader({ memberName, notificationBell }: { memberName?: string; notificationBell?: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy-800/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-2.5 max-w-7xl mx-auto">

          {/* Logo + club name */}
          <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <Image src="/pscc-logo.png" alt="PSCC" width={32} height={32} className="rounded-full" priority />
            <span className="text-navy-100 text-sm font-semibold hidden sm:block">Puget Sound Cricket Club</span>
            <span className="text-navy-100 text-sm font-semibold sm:hidden">PSCC</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 ml-4 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-navy-400 hover:text-navy-100 text-xs px-3 py-1.5 rounded-lg no-underline transition hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side - name + hamburger */}
          <div className="ml-auto flex items-center gap-3">
            {notificationBell && (
              <div className="hidden sm:block">{notificationBell}</div>
            )}
            {memberName && (
              <span className="text-navy-400 text-xs hidden sm:block truncate max-w-32">{memberName}</span>
            )}
            {/* Hamburger - mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex flex-col items-center justify-center gap-1.5 w-8 h-8 rounded-lg hover:bg-white/5 transition"
              aria-label="Menu"
            >
              <span className={`block w-4 h-0.5 bg-navy-300 transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}/>
              <span className={`block w-4 h-0.5 bg-navy-300 transition-all duration-200 ${menuOpen ? "opacity-0 scale-x-0" : ""}`}/>
              <span className={`block w-4 h-0.5 bg-navy-300 transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}/>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-navy-800/98 px-3 py-2 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center text-navy-300 hover:text-navy-100 text-sm px-3 py-2.5 rounded-xl no-underline hover:bg-white/5 transition"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-1 border-t border-white/5 mt-1">
              <a
                href="/api/auth/signout"
                className="flex items-center text-navy-500 hover:text-navy-300 text-sm px-3 py-2.5 rounded-xl no-underline hover:bg-white/5 transition"
              >
                Sign out
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

