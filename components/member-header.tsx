"use client";

import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";
import { useState } from "react";

const navLinks = [
  { href: "/account",        label: "Portal" },
  { href: "/account/stats",  label: "My Stats" },
  { href: "/leaderboard",    label: "Leaderboard" },
  { href: "/podcast",        label: "Podcast" },
  { href: "/about",          label: "About" },
  { href: "/contact",        label: "Contact" },
];

export function MemberHeader({ memberName }: { memberName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy-800/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
          {/* Logo + name */}
          <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="relative w-7 h-7">
              <ClubLogo className="w-7 h-7" />
            </div>
            <span className="text-navy-100 text-sm font-semibold hidden sm:block">
              Puget Sound Cricket Club
            </span>
            <span className="text-navy-100 text-sm font-semibold sm:hidden">PSCC</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 ml-4 flex-1">
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

          {/* Member name + hamburger */}
          <div className="ml-auto flex items-center gap-3">
            {memberName && (
              <span className="text-navy-400 text-xs hidden sm:block">
                {memberName}
              </span>
            )}
            {/* Hamburger button (mobile) */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <span className={`block w-4 h-0.5 bg-navy-300 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`}/>
              <span className={`block w-4 h-0.5 bg-navy-300 transition-all ${menuOpen ? "opacity-0" : ""}`}/>
              <span className={`block w-4 h-0.5 bg-navy-300 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}/>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-navy-800 px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block text-navy-300 hover:text-navy-100 text-sm px-3 py-2 rounded-xl no-underline hover:bg-white/5 transition"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/5">
              <Link
                href="/api/auth/signout"
                onClick={() => setMenuOpen(false)}
                className="block text-navy-500 hover:text-navy-300 text-sm px-3 py-2 rounded-xl no-underline hover:bg-white/5 transition"
              >
                Sign out
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
