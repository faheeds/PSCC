import { PracticeStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPracticeGroundDefaults } from "@/lib/practice-location";

export const WEEKLY_PRACTICE_TITLE = "Wednesday practice";
export const WEEKLY_PRACTICE_FOCUS = "Open nets and batting order check-in";
export const WEEKLY_PRACTICE_CANCELLATION_MESSAGE = "Practice is canceled due to bad weather.";
export const WEEKLY_PRACTICE_WEEKDAY = 3;
export const WEEKLY_PRACTICE_START_HOUR = 16;
export const WEEKLY_PRACTICE_START_MINUTE = 30;
export const WEEKLY_PRACTICE_END_HOUR = 20;
export const WEEKLY_PRACTICE_END_MINUTE = 30;

export async function ensureWeeklyPracticeSessions(options?: {
  pastWeeks?: number;
  futureWeeks?: number;
}) {
  const pastWeeks = options?.pastWeeks ?? 0;
  const futureWeeks = options?.futureWeeks ?? 4;
  const anchor = getWeekdayAnchor(new Date(), WEEKLY_PRACTICE_WEEKDAY);
  const weeksToEnsure = Array.from({ length: pastWeeks + futureWeeks + 1 }, (_, index) => index - pastWeeks);
  const practiceGround = getPracticeGroundDefaults();

  await Promise.all(
    weeksToEnsure.map(async (weekOffset) => {
      const practiceDate = addDays(anchor, weekOffset * 7);
      const startsAt = atLocalTime(practiceDate, WEEKLY_PRACTICE_START_HOUR, WEEKLY_PRACTICE_START_MINUTE);
      const endsAt = atLocalTime(practiceDate, WEEKLY_PRACTICE_END_HOUR, WEEKLY_PRACTICE_END_MINUTE);
      const recurrenceKey = buildWeeklyPracticeKey(practiceDate);

      await prisma.practiceSession.upsert({
        where: { recurrenceKey },
        update: {
          title: WEEKLY_PRACTICE_TITLE,
          location: practiceGround.address,
          startsAt,
          endsAt,
          checkInLatitude: practiceGround.latitude,
          checkInLongitude: practiceGround.longitude,
          checkInRadiusMeters: practiceGround.radiusMeters
        },
        create: {
          recurrenceKey,
          title: WEEKLY_PRACTICE_TITLE,
          location: practiceGround.address,
          startsAt,
          endsAt,
          status: PracticeStatus.PLANNED,
          focusArea: WEEKLY_PRACTICE_FOCUS,
          checkInLatitude: practiceGround.latitude,
          checkInLongitude: practiceGround.longitude,
          checkInRadiusMeters: practiceGround.radiusMeters
        }
      });
    })
  );
}

export function buildWeeklyPracticeKey(date: Date) {
  return `weekly-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getWeeklyPracticeWindowLabel() {
  return "Every Wednesday, 4:30 PM to 8:30 PM";
}

function getWeekdayAnchor(date: Date, weekday: number) {
  const anchor = new Date(date);
  anchor.setHours(0, 0, 0, 0);
  const difference = weekday - anchor.getDay();
  anchor.setDate(anchor.getDate() + difference);
  return anchor;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function atLocalTime(date: Date, hour: number, minute: number) {
  const value = new Date(date);
  value.setHours(hour, minute, 0, 0);
  return value;
}
