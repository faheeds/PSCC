"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { fieldClassName } from "@/components/ui";

export function CredentialsSignInForm({
  provider,
  redirectTo,
  submitLabel
}: {
  provider: "admin-credentials" | "member-credentials";
  redirectTo: string;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await signIn(provider, {
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
            redirect: false,
            callbackUrl: redirectTo
          });

          if (result?.error) {
            setError("We could not sign you in with that email and password.");
            return;
          }

          window.location.href = result?.url ?? redirectTo;
        });
      }}
    >
      <input name="email" type="email" placeholder="Email address" required className={fieldClassName} />
      <input name="password" type="password" placeholder="Password" required className={fieldClassName} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button type="submit" disabled={isPending} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Signing in..." : submitLabel}
      </button>
    </form>
  );
}
