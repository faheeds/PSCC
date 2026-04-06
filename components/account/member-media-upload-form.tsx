"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fieldClassName } from "@/components/ui";

type UploadState = {
  error: string | null;
  success: string | null;
};

export function MemberMediaUploadForm() {
  const router = useRouter();
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [{ error, success }, setUploadState] = useState<UploadState>({ error: null, success: null });

  const durationHint = useMemo(() => {
    if (durationSeconds === null) {
      return "";
    }

    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `Video length: ${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [durationSeconds]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setUploadState({ error: null, success: null });

    if (!file) {
      setSelectedFileName("");
      setDurationSeconds(null);
      return;
    }

    setSelectedFileName(file.name);

    if (!file.type.startsWith("video/")) {
      setDurationSeconds(null);
      return;
    }

    try {
      const measuredDuration = await readVideoDuration(file);
      const roundedDuration = Math.round(measuredDuration);
      setDurationSeconds(roundedDuration);

      if (roundedDuration > 30) {
        setUploadState({ error: "Videos must be 30 seconds or shorter.", success: null });
      }
    } catch {
      setDurationSeconds(null);
      setUploadState({ error: "We could not read that video length. Please choose another clip.", success: null });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadState({ error: null, success: null });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!(file instanceof File) || !file.size) {
      setUploadState({ error: "Choose a photo or short video before submitting.", success: null });
      return;
    }

    if (file.type.startsWith("video/")) {
      if (durationSeconds === null) {
        setUploadState({ error: "We could not confirm the video length yet. Please wait a moment and try again.", success: null });
        return;
      }

      if (durationSeconds > 30) {
        setUploadState({ error: "Videos must be 30 seconds or shorter.", success: null });
        return;
      }

      formData.set("durationSeconds", String(durationSeconds));
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/member/media", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setUploadState({ error: payload?.error ?? "Unable to upload media right now.", success: null });
        return;
      }

      form.reset();
      setSelectedFileName("");
      setDurationSeconds(null);
      setUploadState({ error: null, success: "Thanks. Your upload is now in the social media review queue." });
      router.refresh();
    } catch {
      setUploadState({ error: "Unable to upload media right now.", success: null });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <input name="title" required placeholder="Title this photo or clip" className={fieldClassName} />
        <input name="eventTitle" placeholder="Game, practice, or event" className={fieldClassName} />
        <input
          name="file"
          type="file"
          accept="image/*,video/*"
          required
          className={`${fieldClassName} md:col-span-2 file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-900`}
          onChange={handleFileChange}
        />
        <textarea name="caption" placeholder="Add a quick caption or context for the social team" className={`${fieldClassName} md:col-span-2 min-h-24`} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p>Photos up to 10MB and videos up to 25MB are supported. Videos must be under 30 seconds.</p>
        {selectedFileName ? <p className="mt-1 font-medium text-slate-700">{selectedFileName}</p> : null}
        {durationHint ? <p className="mt-1">{durationHint}</p> : null}
      </div>

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-brand-700">{success}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Uploading..." : "Share with social team"}
      </button>
    </form>
  );
}

function readVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();

      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error("Invalid duration"));
        return;
      }

      resolve(duration);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Unable to read metadata"));
    };

    video.src = objectUrl;
  });
}
