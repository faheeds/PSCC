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
  title: "PSCC Members and Admin Portal",
  description: "Manage member dues, game fees, reimbursements, and online payments for Puget Sound Cricket Club."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} font-body`}>
        <div className="min-h-screen">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
