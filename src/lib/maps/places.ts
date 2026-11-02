import {
  EDITORIAL_PATH_LIMITS,
  LOCATION_DEFAULTS,
  PATH_COLORS,
  PATH_STYLES,
  PLACE_ICONS,
  ROUTING_PROVIDER,
  validateCoordinates,
  validateMapLocation,
  type LocationMapBlock,
  type MapCoordinates,
  type MapEditorialPath,
  type MapPlace,
  type MapRoute,
  type PathColor,
  type PathStyle,
  type PlaceIcon,
} from "./location.ts";

export const LEGACY_PLACE_KEY = "legacy";

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export function isPlaceIcon(value: unknown): value is PlaceIcon {
  return (
    typeof value === "string" &&
    (PLACE_ICONS as readonly string[]).includes(value)
  );
}

export function validatePlace(
  place: MapPlace | null | undefined,
): string | undefined {
  if (!place) return "Location is missing.";
  if (!place._key || typeof place._key !== "string") {
    return "Location is missing its stable key.";
  }
  if (!place.label || !place.label.trim())
    return "Every location needs a label.";
  if (place.label.length > 80)
    return "Location labels must be 80 characters or fewer.";
  if (place.description && place.description.length > 300) {
    return "Location descriptions must be 300 characters or fewer.";
  }
  const coordinatesError = validateCoordinates(place.coordinates);
  if (coordinatesError) return coordinatesError;
  if (place.precision !== "exact" && place.precision !== "approximate") {
    return "Choose exact pin or approximate area precision.";
  }
  if (place.precision === "approximate") {
    if (
      !Number.isFinite(place.radiusMeters) ||
      place.radiusMeters! < LOCATION_DEFAULTS.minimumRadiusMeters ||
      place.radiusMeters! > LOCATION_DEFAULTS.maximumRadiusMeters
    ) {
      return `Approximate radius must be between ${LOCATION_DEFAULTS.minimumRadiusMeters} and ${LOCATION_DEFAULTS.maximumRadiusMeters} metres.`;
    }
  } else if (place.icon !== undefined && !isPlaceIcon(place.icon)) {
    return `Icon must be one of: ${PLACE_ICONS.join(", ")}.`;
  }
  if (place.showLabel !== undefined && typeof place.showLabel !== "boolean") {
    return "The label option must be true or false.";
  }
  return undefined;
}

export function validatePlaces(
  places: MapPlace[] | null | undefined,
): string | undefined {
  if (!places || places.length === 0) return undefined;
  const seen = new Set<string>();
  for (const [index, place] of places.entries()) {
    const error = validatePlace(place);
    if (error) return `Location ${index + 1}: ${error}`;
    if (seen.has(place._key!)) {
      return `Location ${index + 1}: duplicate key "${place._key}".`;
    }
    seen.add(place._key!);
  }
  return undefined;
}

export function iconForPlace(place: MapPlace): PlaceIcon {
  return isPlaceIcon(place.icon) ? place.icon : "pin";
}

/**
 * Legacy blocks only have `location`. They become one place keyed `legacy`;
 * stored content is never rewritten. `locations` wins when it is non-empty.
 */
export function normalizePlaces(
  block: Pick<LocationMapBlock, "location" | "locations" | "title">,
  fallbackLabel = "",
): MapPlace[] {
  if (Array.isArray(block.locations) && block.locations.length > 0) {
    return block.locations;
  }
  const { location } = block;
  if (!location || validateMapLocation(location)) return [];
  return [
    {
      _key: LEGACY_PLACE_KEY,
      label: block.title?.trim() || fallbackLabel,
      coordinates: location.coordinates,
      precision: location.precision,
      radiusMeters: location.radiusMeters,
      icon: "pin",
    },
  ];
}

export const isLegacyBlock = (
  block: Pick<LocationMapBlock, "location" | "locations">,
): boolean => !(block.locations && block.locations.length > 0);

export function validPlaces(places: MapPlace[]): MapPlace[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    if (validatePlace(place) || seen.has(place._key!)) return false;
    seen.add(place._key!);
    return true;
  });
}

export function isRouteEligible(place: MapPlace | undefined): boolean {
  return !!place && place.precision === "exact" && !validatePlace(place);
}

const metresPerDegree = 111_320;

export function placesBounds(places: MapPlace[]): MapBounds | undefined {
  let bounds: MapBounds | undefined;
  for (const place of places) {
    const point = place.coordinates;
    if (!point || validateCoordinates(point)) continue;
    const radius =
      place.precision === "approximate" ? (place.radiusMeters ?? 0) : 0;
    const latPad = radius / metresPerDegree;
    const cos = Math.max(Math.cos((point.lat * Math.PI) / 180), 0.01);
    const lngPad = radius / (metresPerDegree * cos);
    const next: MapBounds = {
      south: Math.max(point.lat - latPad, -90),
      north: Math.min(point.lat + latPad, 90),
      west: Math.max(point.lng - lngPad, -180),
      east: Math.min(point.lng + lngPad, 180),
    };
    bounds = bounds
      ? {
          south: Math.min(bounds.south, next.south),
          north: Math.max(bounds.north, next.north),
          west: Math.min(bounds.west, next.west),
          east: Math.max(bounds.east, next.east),
        }
      : next;
  }
  return bounds;
}

export function extendBoundsWithPoints(
  bounds: MapBounds | undefined,
  points: [number, number][],
): MapBounds | undefined {
  let result = bounds;
  for (const [lat, lng] of points) {
    result = result
      ? {
          south: Math.min(result.south, lat),
          north: Math.max(result.north, lat),
          west: Math.min(result.west, lng),
          east: Math.max(result.east, lng),
        }
      : { south: lat, north: lat, west: lng, east: lng };
  }
  return result;
}

const round = (value: number) => Number(value.toFixed(6));

/** Fingerprint of the ordered stops; any key, order or coordinate change alters it. */
export function routeStopsSignature(
  places: MapPlace[],
  stopKeys: string[] | undefined,
): string | undefined {
  if (!Array.isArray(stopKeys) || stopKeys.length === 0) return undefined;
  const parts: string[] = [];
  for (const key of stopKeys) {
    const place = places.find((candidate) => candidate._key === key);
    if (!place || !place.coordinates) return undefined;
    parts.push(
      `${key}@${round(place.coordinates.lat)},${round(place.coordinates.lng)}`,
    );
  }
  return parts.join("|");
}

export function isRouteStale(
  route: MapRoute | null | undefined,
  places: MapPlace[],
): boolean {
  if (!route?.geometry) return true;
  const current = routeStopsSignature(places, route.stopKeys);
  return !current || current !== route.stopsSignature;
}

const POLYLINE_PATTERN = /^[?-~]+$/;

export function decodePolyline6(encoded: string): [number, number][] {
  if (!POLYLINE_PATTERN.test(encoded)) throw new Error("Invalid polyline.");
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const readValue = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= encoded.length) throw new Error("Truncated polyline.");
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += readValue();
    lng += readValue();
    const point: [number, number] = [lat / 1e6, lng / 1e6];
    if (validateCoordinates({ lat: point[0], lng: point[1] })) {
      throw new Error("Polyline contains invalid coordinates.");
    }
    points.push(point);
  }
  return points;
}

export function validateRoute(
  route: MapRoute | null | undefined,
  places: MapPlace[] | null | undefined,
): string | undefined {
  if (!route || !route.enabled) return undefined;
  const all = places ?? [];
  const keys = route.stopKeys ?? [];
  if (keys.length < 2)
    return "Choose at least two exact locations as route stops.";
  if (keys.length > ROUTING_PROVIDER.maxStops) {
    return `A route can have at most ${ROUTING_PROVIDER.maxStops} stops.`;
  }
  if (new Set(keys).size !== keys.length)
    return "Each route stop can only be used once.";
  for (const key of keys) {
    const place = all.find((candidate) => candidate._key === key);
    if (!place) return `Route stop "${key}" no longer exists.`;
    if (!isRouteEligible(place)) {
      return `Route stop "${place.label ?? key}" must be a valid exact location.`;
    }
  }
  if (!route.geometry) return "Calculate the route before publishing.";
  if (route.geometry.length > ROUTING_PROVIDER.maxGeometryLength) {
    return "Saved route geometry is too large.";
  }
  try {
    if (decodePolyline6(route.geometry).length < 2) {
      return "Saved route geometry is invalid. Recalculate the route.";
    }
  } catch {
    return "Saved route geometry is invalid. Recalculate the route.";
  }
  if (
    !Number.isFinite(route.distanceMeters) ||
    route.distanceMeters! < 0 ||
    !Number.isFinite(route.durationSeconds) ||
    route.durationSeconds! < 0 ||
    !route.calculatedAt ||
    Number.isNaN(Date.parse(route.calculatedAt))
  ) {
    return "Saved route details are incomplete. Recalculate the route.";
  }
  if (isRouteStale(route, all)) {
    return "The route is out of date because stops, order or coordinates changed. Recalculate it.";
  }
  return undefined;
}

/** The route the public page may draw: enabled, valid and fresh. Never a straight line. */
export function publicRoute(
  route: MapRoute | null | undefined,
  places: MapPlace[],
): (MapRoute & { points: [number, number][] }) | undefined {
  if (!route?.enabled || validateRoute(route, places)) return undefined;
  try {
    return { ...route, points: decodePolyline6(route.geometry!) };
  } catch {
    return undefined;
  }
}

/** Parses an OSRM response; throws on anything unexpected so bad data is never saved. */
export function parseOsrmRoute(payload: unknown): {
  geometry: string;
  distanceMeters: number;
  durationSeconds: number;
} {
  const data = payload as {
    code?: unknown;
    routes?: { geometry?: unknown; distance?: unknown; duration?: unknown }[];
  };
  const route = data?.routes?.[0];
  if (
    data?.code !== "Ok" ||
    !route ||
    typeof route.geometry !== "string" ||
    typeof route.distance !== "number" ||
    typeof route.duration !== "number" ||
    !Number.isFinite(route.distance) ||
    !Number.isFinite(route.duration)
  ) {
    throw new Error("The routing service did not return a driving route.");
  }
  if (route.geometry.length > ROUTING_PROVIDER.maxGeometryLength) {
    throw new Error(
      "The route is too large to save. Use fewer or closer stops.",
    );
  }
  if (decodePolyline6(route.geometry).length < 2) {
    throw new Error("The routing service returned an empty route.");
  }
  return {
    geometry: route.geometry,
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
  };
}

export function routeRequestUrl(coordinates: MapCoordinates[]): string {
  const path = coordinates
    .map((point) => `${point.lng},${point.lat}`)
    .join(";");
  return `${ROUTING_PROVIDER.endpoint}/${path}?overview=full&geometries=polyline6&steps=false`;
}

export function createPlaceKey(existing: string[]): string {
  const random = () => Math.random().toString(36).slice(2, 10);
  let key = `place-${random()}`;
  while (existing.includes(key)) key = `place-${random()}`;
  return key;
}

const isPathColor = (value: unknown): value is PathColor =>
  typeof value === "string" && Object.hasOwn(PATH_COLORS, value);
const isPathStyle = (value: unknown): value is PathStyle =>
  typeof value === "string" &&
  (PATH_STYLES as readonly string[]).includes(value);

/** Only an enabled path is validated; a disabled path never blocks publishing. */
export function validateEditorialPath(
  path: MapEditorialPath | null | undefined,
): string | undefined {
  if (!path || !path.enabled) return undefined;
  if (path.label && path.label.length > 120)
    return "The path label must be 120 characters or fewer.";
  if (path.description && path.description.length > 500)
    return "The path description must be 500 characters or fewer.";
  if (path.color !== undefined && !isPathColor(path.color))
    return `Path colour must be one of: ${Object.keys(PATH_COLORS).join(", ")}.`;
  if (path.style !== undefined && !isPathStyle(path.style))
    return `Path style must be one of: ${PATH_STYLES.join(", ")}.`;
  const points = path.points;
  if (
    !Array.isArray(points) ||
    points.length < EDITORIAL_PATH_LIMITS.minimumPoints
  ) {
    return `Draw at least ${EDITORIAL_PATH_LIMITS.minimumPoints} path points on the map.`;
  }
  if (points.length > EDITORIAL_PATH_LIMITS.maximumPoints) {
    return `A path can have at most ${EDITORIAL_PATH_LIMITS.maximumPoints} points.`;
  }
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const problem = validateCoordinates(point);
    if (problem) return `Path point ${index + 1}: ${problem}`;
    const previous = points[index - 1];
    if (previous && previous.lat === point.lat && previous.lng === point.lng) {
      return `Path points ${index} and ${index + 1} are identical; remove one.`;
    }
  }
  return undefined;
}

export interface PublicEditorialPath {
  points: [number, number][];
  color: string;
  dashArray?: string;
  label?: string;
  description?: string;
}

/** Normalized public data, or undefined when disabled or invalid. No straight-line fallback. */
export function publicEditorialPath(
  path: MapEditorialPath | null | undefined,
): PublicEditorialPath | undefined {
  if (!path || !path.enabled || validateEditorialPath(path)) return undefined;
  return {
    points: path.points!.map((point) => [point.lat, point.lng]),
    color: PATH_COLORS[path.color ?? "blue"],
    dashArray: path.style === "dashed" ? "10 10" : undefined,
    label: path.label?.trim() || undefined,
    description: path.description?.trim() || undefined,
  };
}

/** Fingerprint of every location (exact and approximate) for the review warning. */
export function placesSignature(places: MapPlace[] | undefined): string {
  return (places ?? [])
    .filter((place) => place._key && !validateCoordinates(place.coordinates))
    .map(
      (place) =>
        `${place._key}@${round(place.coordinates!.lat)},${round(place.coordinates!.lng)}`,
    )
    .join("|");
}

/** True when locations changed after the path was last edited. Never alters the path. */
export function editorialPathNeedsReview(
  path: MapEditorialPath | null | undefined,
  places: MapPlace[] | undefined,
): boolean {
  if (!path?.enabled || !path.points?.length) return false;
  return (
    path.locationsSignature !== undefined &&
    path.locationsSignature !== placesSignature(places)
  );
}
