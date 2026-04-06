export const PRACTICE_GROUND_ADDRESS = "1907 150th Ave SE, Bellevue, WA 98007";
export const PRACTICE_GROUND_LATITUDE = 47.5816;
export const PRACTICE_GROUND_LONGITUDE = -122.14;
export const PRACTICE_GROUND_RADIUS_METERS = 200;

export function getPracticeGroundDefaults() {
  return {
    address: PRACTICE_GROUND_ADDRESS,
    latitude: PRACTICE_GROUND_LATITUDE,
    longitude: PRACTICE_GROUND_LONGITUDE,
    radiusMeters: PRACTICE_GROUND_RADIUS_METERS
  };
}
