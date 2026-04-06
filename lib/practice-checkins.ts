const EARTH_RADIUS_METERS = 6_371_000;

export const DEFAULT_PRACTICE_CHECK_IN_RADIUS_METERS = 200;

export function getPracticeCheckInOpenTime(startsAt: Date | string) {
  return new Date(startsAt);
}

export function isPracticeCheckInOpen(
  practice: { startsAt: Date | string; endsAt: Date | string; status?: string | null },
  now = new Date()
) {
  if (practice.status === "CANCELLED") {
    return false;
  }

  const opensAt = getPracticeCheckInOpenTime(practice.startsAt);
  const closesAt = new Date(practice.endsAt);

  return now >= opensAt && now <= closesAt;
}

export function calculateDistanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
) {
  const latA = toRadians(latitudeA);
  const latB = toRadians(latitudeB);
  const deltaLat = toRadians(latitudeB - latitudeA);
  const deltaLng = toRadians(longitudeB - longitudeA);

  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Math.round(EARTH_RADIUS_METERS * arc);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
