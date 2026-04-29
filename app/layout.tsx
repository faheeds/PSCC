import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "PSCC — Puget Sound Cricket Club",
  description: "Member portal for Puget Sound Cricket Club. Check in for practice, pay dues, and share match photos.",
  icons: {
    icon: "/pscc-logo.png",
    apple: "/pscc-logo.png",
    shortcut: "/pscc-logo.png",
  },
  openGraph: {
    title: "Puget Sound Cricket Club",
    description: "Seattle's premier cricket club. Practice check-in, dues, and more.",
    images: ["/pscc-logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} font-body`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
