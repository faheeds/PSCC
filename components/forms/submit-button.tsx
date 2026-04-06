"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  label,
  pendingLabel,
  className
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? "rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
