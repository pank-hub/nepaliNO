export const NORWAY_LOCATOR_VIEWBOX = "0 0 76 92";

// Simplified mainland Norway polygon (Natural Earth / NOR.geo.json) in Mercator-projected viewBox coords.
export const NORWAY_MAINLAND_PATH =
  "M63.9,6.4L71.7,12.0L68.5,14.0L71.2,18.6L67.0,21.5L64.9,22.1L66.0,17.1L62.8,14.2L58.9,16.7L57.6,21.9L55.2,25.0L52.5,23.3L49.2,23.7L46.4,20.0L44.9,21.8L43.4,22.1L43.0,26.7L38.2,25.6L37.6,29.4L35.2,29.4L33.5,34.1L31.0,41.1L27.1,49.7L28.0,51.7L27.1,54.0L24.6,53.9L23.0,59.2L23.1,66.4L24.7,69.1L23.9,75.2L21.8,78.6L20.7,81.4L19.0,78.4L14.0,84.1L10.7,85.2L7.2,82.7L6.3,77.5L5.5,65.5L7.8,62.0L14.5,57.4L19.4,51.5L24.0,43.1L30.1,30.7L34.3,25.6L41.2,16.7L46.8,13.5L50.9,13.9L54.7,7.6L59.3,7.9L63.9,6.4Z";

export const NORWAY_LOCATOR_BOUNDS = {
  minLat: 57.8,
  maxLat: 71.3,
  minLng: 4.4,
  maxLng: 31.4,
} as const;

const WIDTH = 76;
const HEIGHT = 92;
const PAD = 4;

const mercatorY = (lat: number) => {
  const rad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
};

const Y_MIN = mercatorY(NORWAY_LOCATOR_BOUNDS.minLat);
const Y_MAX = mercatorY(NORWAY_LOCATOR_BOUNDS.maxLat);
const LNG_SPAN_RAD =
  ((NORWAY_LOCATOR_BOUNDS.maxLng - NORWAY_LOCATOR_BOUNDS.minLng) * Math.PI) /
  180;
const SCALE = Math.min((WIDTH - 2 * PAD) / LNG_SPAN_RAD, (HEIGHT - 2 * PAD) / (Y_MAX - Y_MIN));
const OFFSET_X = (WIDTH - LNG_SPAN_RAD * SCALE) / 2;
const OFFSET_Y = (HEIGHT - (Y_MAX - Y_MIN) * SCALE) / 2;

export function isWithinNorwayBounds(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= NORWAY_LOCATOR_BOUNDS.minLat &&
    lat <= NORWAY_LOCATOR_BOUNDS.maxLat &&
    lng >= NORWAY_LOCATOR_BOUNDS.minLng &&
    lng <= NORWAY_LOCATOR_BOUNDS.maxLng
  );
}

export function projectNorwayPoint(
  lat: number,
  lng: number,
): { x: number; y: number } | undefined {
  if (!isWithinNorwayBounds(lat, lng)) return undefined;
  const x =
    OFFSET_X +
    (((lng - NORWAY_LOCATOR_BOUNDS.minLng) * Math.PI) / 180) * SCALE;
  const y = OFFSET_Y + (Y_MAX - mercatorY(lat)) * SCALE;
  return {
    x: Number(x.toFixed(1)),
    y: Number(y.toFixed(1)),
  };
}
