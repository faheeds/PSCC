"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";

export function GoogleSignInButton({
  callbackUrl,
  portal
}: {
  callbackUrl: string;
  portal: "member" | "admin";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          document.cookie = `pscc-portal-intent=${portal}; Max-Age=600; Path=/; SameSite=Lax`;
          await signIn("google", { callbackUrl });
        });
      }}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm disabled:opacity-60"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700 shadow-sm">
        G
      </span>
      {isPending ? "Redirecting to Google..." : "Continue with Google"}
    </button>
  );
}
