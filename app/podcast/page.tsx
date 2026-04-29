import { PublicHeader, BottomNav } from "@/components/site-header";
import Link from "next/link";

export default function PodcastPage() {
  return (
    <main className="min-h-screen bg-navy-900 pb-24">
      <PublicHeader />

      <div className="px-4 pt-8 max-w-3xl mx-auto">
        <p className="text-forest-400 text-xs font-semibold uppercase tracking-widest mb-1">PSCC Podcast</p>
        <h1 className="text-navy-100 text-2xl font-display font-semibold mb-2">The Cricket Podcast</h1>
        <p className="text-navy-400 text-sm mb-8">Listen to episodes featuring cricket news, match analysis, and PSCC club updates.</p>

        {/* Spotify embed placeholder */}
        <div className="bg-navy-800 border border-white/5 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-forest-700/30 border border-forest-600/30 rounded-full flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="11" stroke="#52b788" strokeWidth="1.5"/>
              <path d="M11 10l8 4-8 4V10z" fill="#52b788"/>
            </svg>
          </div>
          <h2 className="text-navy-100 text-lg font-semibold">Coming Soon</h2>
          <p className="text-navy-400 text-sm max-w-sm mx-auto">
            The PSCC podcast is being set up. Check back soon for cricket talk, match previews, and club stories.
          </p>
          <div className="pt-2">
            <Link href="/" className="text-sage text-sm no-underline hover:text-mint transition">← Back to home</Link>
          </div>
        </div>
      </div>

      <BottomNav active="podcast" />
    </main>
  );
}
