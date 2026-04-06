"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { formatDateTime, formatDistanceMeters } from "@/lib/utils";

type PracticeCheckInPanelProps = {
  practices: Array<{
    id: string;
    title: string;
    location: string;
    startsAt: string;
    endsAt: string;
    status: string;
    cancellationReason: string;
    focusArea: string | null;
    checkInConfigured: boolean;
    checkInRadiusMeters: number;
    checkInOpen: boolean;
    checkInOpensAt: string;
    checkedInMemberCount: number;
    memberCheckIn: {
      arrivalOrder: number;
      checkedInAt: string;
      distanceMeters: number | null;
    } | null;
  }>;
};

type CheckInState = {
  error: string | null;
  success: string | null;
  activePracticeId: string | null;
};

export function PracticeCheckInPanel({ practices }: PracticeCheckInPanelProps) {
  const router = useRouter();
  const [state, setState] = useState<CheckInState>({
    error: null,
    success: null,
    activePracticeId: null
  });

  async function handleCheckIn(practiceId: string) {
    setState({
      error: null,
      success: null,
      activePracticeId: practiceId
    });

    if (!navigator.geolocation) {
      setState({
        error: "This device does not support location-based check-in.",
        success: null,
        activePracticeId: null
      });
      return;
    }

    try {
      const position = await getCurrentPosition();
      const response = await fetch("/api/member/practice-checkins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          practiceSessionId: practiceId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            arrivalOrder?: number;
            checkedInAt?: string;
            distanceMeters?: number | null;
            alreadyCheckedIn?: boolean;
          }
        | null;

      if (!response.ok) {
        setState({
          error: payload?.error ?? "Unable to check in right now.",
          success: null,
          activePracticeId: null
        });
        return;
      }

      const queueLabel = payload?.arrivalOrder ? `You are number ${payload.arrivalOrder} in the batting order list.` : "You are checked in.";
      const suffix = payload?.alreadyCheckedIn ? " Your existing spot has been kept." : "";

      setState({
        error: null,
        success: `${queueLabel}${suffix}`,
        activePracticeId: null
      });
      router.refresh();
    } catch (error) {
      const message = isGeolocationError(error) ? mapLocationError(error) : "Unable to check in right now. Please try again in a moment.";

      setState({
        error: message,
        success: null,
        activePracticeId: null
      });
    }
  }

  if (!practices.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        No practice check-in is open right now.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {practices.map((practice) => {
        const isBusy = state.activePracticeId === practice.id;
        const alreadyCheckedIn = Boolean(practice.memberCheckIn);
        const isCancelled = practice.status === "CANCELLED";
        const canCheckIn = practice.checkInConfigured && practice.checkInOpen && !alreadyCheckedIn && !isCancelled;

        return (
          <div key={practice.id} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-ink">{practice.title}</p>
                <p className="text-sm text-slate-500">
                  {practice.location} | {formatDateTime(practice.startsAt)} to {formatDateTime(practice.endsAt)}
                </p>
                {practice.focusArea ? <p className="text-sm text-slate-700">{practice.focusArea}</p> : null}
              </div>
              <Badge
                className={
                  alreadyCheckedIn
                    ? "bg-brand-50 text-brand-800"
                    : isCancelled
                      ? "bg-rose-50 text-rose-700"
                      : practice.checkInOpen
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                }
              >
                {alreadyCheckedIn ? "Checked in" : isCancelled ? "Canceled" : practice.checkInOpen ? "Open now" : "Opens later"}
              </Badge>
            </div>

            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>{practice.checkedInMemberCount} member{practice.checkedInMemberCount === 1 ? "" : "s"} already checked in.</p>
              <p>Allowed check-in radius: {formatDistanceMeters(practice.checkInRadiusMeters)}</p>
              {!practice.checkInConfigured ? <p>Check-in is not ready yet because the practice location has not been set.</p> : null}
              {isCancelled ? <p className="font-medium text-rose-600">{practice.cancellationReason}</p> : null}
              {!practice.checkInOpen && !alreadyCheckedIn && !isCancelled ? <p>Check-in opens at {formatDateTime(practice.checkInOpensAt)}.</p> : null}
              {practice.memberCheckIn ? (
                <p>
                  You checked in at {formatDateTime(practice.memberCheckIn.checkedInAt)} and you are number {practice.memberCheckIn.arrivalOrder}
                  {practice.memberCheckIn.distanceMeters !== null ? ` (${formatDistanceMeters(practice.memberCheckIn.distanceMeters)} from the saved ground point).` : "."}
                </p>
              ) : null}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleCheckIn(practice.id)}
                disabled={!canCheckIn || isBusy}
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? "Checking in..." : alreadyCheckedIn ? "Already checked in" : isCancelled ? "Practice canceled" : "Check in at practice"}
              </button>
            </div>
          </div>
        );
      })}

      {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-brand-700">{state.success}</p> : null}
    </div>
  );
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0
    });
  });
}

function mapLocationError(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access was blocked. Please allow it so the app can confirm you are at the ground.";
    case error.POSITION_UNAVAILABLE:
      return "Your location could not be determined. Move to a clearer outdoor spot and try again.";
    case error.TIMEOUT:
      return "Location lookup took too long. Please try again.";
    default:
      return "Unable to read your location right now.";
  }
}

function isGeolocationError(error: unknown): error is GeolocationPositionError {
  return typeof error === "object" && error !== null && "code" in error;
}
