import { PracticeStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertMemberApiRequest } from "@/lib/member-auth";
import { getPracticeGroundDefaults } from "@/lib/practice-location";
import {
  DEFAULT_PRACTICE_CHECK_IN_RADIUS_METERS,
  calculateDistanceMeters,
  getPracticeCheckInOpenTime,
  isPracticeCheckInOpen
} from "@/lib/practice-checkins";
import { WEEKLY_PRACTICE_CANCELLATION_MESSAGE, ensureWeeklyPracticeSessions } from "@/lib/weekly-practices";

export async function POST(request: Request) {
  try {
    await ensureWeeklyPracticeSessions({ pastWeeks: 0, futureWeeks: 2 });
    const session = await assertMemberApiRequest();
    const memberId = session.user?.memberId;
    const body = (await request.json().catch(() => null)) as
      | {
          practiceSessionId?: string;
          latitude?: number;
          longitude?: number;
        }
      | null;

    const practiceSessionId = String(body?.practiceSessionId || "").trim();
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);

    if (!practiceSessionId) {
      return NextResponse.json({ error: "Choose a practice before checking in." }, { status: 400 });
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: "We could not read your location. Please allow location access and try again." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const practice = await tx.practiceSession.findUnique({
        where: { id: practiceSessionId },
        include: {
          checkIns: {
            where: { memberId },
            select: {
              arrivalOrder: true,
              checkedInAt: true,
              distanceMeters: true
            }
          }
        }
      });

      if (!practice) {
        throw new Error("That practice is not open for check-in.");
      }

      if (practice.status === PracticeStatus.CANCELLED) {
        throw new Error(practice.cancellationReason || WEEKLY_PRACTICE_CANCELLATION_MESSAGE);
      }

      if (practice.status !== PracticeStatus.PLANNED) {
        throw new Error("That practice is not open for check-in.");
      }

      if (!isPracticeCheckInOpen(practice)) {
        const opensAt = getPracticeCheckInOpenTime(practice.startsAt);
        throw new Error(`Check-in opens at ${opensAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.`);
      }

      const practiceGround = getPracticeGroundDefaults();
      const checkInLatitude = practice.checkInLatitude ?? practiceGround.latitude;
      const checkInLongitude = practice.checkInLongitude ?? practiceGround.longitude;
      const allowedRadiusMeters = practice.checkInRadiusMeters || practiceGround.radiusMeters || DEFAULT_PRACTICE_CHECK_IN_RADIUS_METERS;
      const distanceMeters = calculateDistanceMeters(latitude, longitude, checkInLatitude, checkInLongitude);

      if (distanceMeters > allowedRadiusMeters) {
        throw new Error(`You need to be closer to the ground to check in. Current distance: ${distanceMeters} meters.`);
      }

      const existingCheckIn = practice.checkIns[0];
      if (existingCheckIn) {
        return {
          arrivalOrder: existingCheckIn.arrivalOrder,
          checkedInAt: existingCheckIn.checkedInAt,
          distanceMeters: existingCheckIn.distanceMeters ?? distanceMeters,
          alreadyCheckedIn: true
        };
      }

      const arrivalOrder = (await tx.practiceCheckIn.count({
        where: { practiceSessionId }
      })) + 1;

      const createdCheckIn = await tx.practiceCheckIn.create({
        data: {
          practiceSessionId,
          memberId: memberId ?? "",
          arrivalOrder,
          latitude,
          longitude,
          distanceMeters
        }
      });

      await tx.practiceSession.update({
        where: { id: practiceSessionId },
        data: {
          actualAttendance: arrivalOrder
        }
      });

      return {
        arrivalOrder: createdCheckIn.arrivalOrder,
        checkedInAt: createdCheckIn.checkedInAt,
        distanceMeters: createdCheckIn.distanceMeters ?? distanceMeters,
        alreadyCheckedIn: false
      };
    });

    return NextResponse.json({
      ok: true,
      arrivalOrder: result.arrivalOrder,
      checkedInAt: result.checkedInAt,
      distanceMeters: result.distanceMeters,
      alreadyCheckedIn: result.alreadyCheckedIn
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check in right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
