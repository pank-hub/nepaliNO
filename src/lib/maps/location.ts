export const MAP_PROVIDER = {
  tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
  search: "https://www.openstreetmap.org/search?query=",
  maxZoom: 19,
  // OSM rejects tile requests without a Referer; keep it explicit.
  referrerPolicy: "strict-origin-when-cross-origin",
} as const;

// Release safeguard: permission to store and publicly display FOSSGIS route
// geometry is unverified. While false, Studio never contacts the routing service.
// Hides the automatic-route editor in Studio and disables calculation. Stored route data
// is kept and still rendered. Flip only after provider permission is confirmed.
export const ROUTING_CALCULATION_ENABLED = false;

// Used only from the Studio "Calculate route" action; public pages never call it.
export const ROUTING_PROVIDER = {
  name: "FOSSGIS OSRM (routing.openstreetmap.de)",
  endpoint: "https://routing.openstreetmap.de/routed-car/route/v1/driving",
  attribution: "Routing: FOSSGIS OSRM, data © OpenStreetMap contributors",
  fixTheMapUrl: "https://www.openstreetmap.org/fixthemap",
  minimumIntervalMs: 1100,
  timeoutMs: 15_000,
  maxStops: 10,
  maxGeometryLength: 100_000,
} as const;

export const LOCATION_DEFAULTS = {
  exactZoom: 15,
  approximateZoom: 12,
  radiusMeters: 500,
  minimumRadiusMeters: 50,
  maximumRadiusMeters: 100_000,
  minimumZoom: 1,
  maximumZoom: MAP_PROVIDER.maxZoom,
  defaultCenter: { lat: 59.9139, lng: 10.7522 },
} as const;

export type LocationPrecision = "exact" | "approximate";

export interface MapCoordinates {
  lat: number;
  lng: number;
  alt?: number;
}

export interface MapLocation {
  _type?: "mapLocation";
  coordinates?: MapCoordinates;
  precision?: LocationPrecision;
  radiusMeters?: number;
  initialZoom?: number;
}

export const PLACE_ICONS = [
  "pin",
  "home",
  "parking",
  "restaurant",
  "hospital",
  "airport",
  "warning",
] as const;
export type PlaceIcon = (typeof PLACE_ICONS)[number];

export interface MapPlace {
  _key?: string;
  _type?: "mapPlace";
  label?: string;
  description?: string;
  coordinates?: MapCoordinates;
  precision?: LocationPrecision;
  radiusMeters?: number;
  icon?: PlaceIcon;
  /** Exact places only. `undefined` keeps the earlier behaviour (label always shown). */
  showLabel?: boolean;
}

// Manual editorial path: editor-drawn geometry, never a calculated driving route.
export const PATH_COLORS = {
  blue: "#1d4ed8",
  red: "#b42318",
  orange: "#c2410c",
  green: "#15803d",
  purple: "#7e22ce",
  black: "#111827",
} as const;
export type PathColor = keyof typeof PATH_COLORS;
export const PATH_STYLES = ["solid", "dashed"] as const;
export type PathStyle = (typeof PATH_STYLES)[number];

export const EDITORIAL_PATH_LIMITS = {
  minimumPoints: 2,
  maximumPoints: 500,
} as const;

export interface MapEditorialPath {
  enabled?: boolean;
  label?: string;
  description?: string;
  color?: PathColor;
  style?: PathStyle;
  points?: (MapCoordinates & { _key?: string; _type?: string })[];
  updatedAt?: string;
  /** Fingerprint of the locations when the path was last edited; used only to warn. */
  locationsSignature?: string;
}

export interface MapRoute {
  enabled?: boolean;
  stopKeys?: string[];
  geometry?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  calculatedAt?: string;
  providerName?: string;
  stopsSignature?: string;
}

export interface LocationMapBlock {
  _type?: "locationMap";
  _key?: string;
  title?: string;
  /** Legacy single location. Still rendered when `locations` is empty. */
  location?: MapLocation;
  locations?: MapPlace[];
  initialZoom?: number;
  route?: MapRoute;
  editorialPath?: MapEditorialPath;
  caption?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  accessibleDescription?: string;
}

export function validateCoordinates(
  coordinates: MapCoordinates | null | undefined,
): string | undefined {
  if (!coordinates) return "Choose a map location.";
  if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) {
    return "Latitude and longitude must be finite numbers.";
  }
  if (coordinates.lat < -90 || coordinates.lat > 90) {
    return "Latitude must be between -90 and 90.";
  }
  if (coordinates.lng < -180 || coordinates.lng > 180) {
    return "Longitude must be between -180 and 180.";
  }
  return undefined;
}

export function validateMapLocation(
  location: MapLocation | null | undefined,
): string | undefined {
  if (!location) return "Choose a map location.";
  const coordinatesError = validateCoordinates(location.coordinates);
  if (coordinatesError) return coordinatesError;
  if (
    !location.precision ||
    !["exact", "approximate"].includes(location.precision)
  ) {
    return "Choose exact pin or approximate area precision.";
  }
  if (
    location.precision === "approximate" &&
    (!Number.isFinite(location.radiusMeters) ||
      location.radiusMeters! < LOCATION_DEFAULTS.minimumRadiusMeters ||
      location.radiusMeters! > LOCATION_DEFAULTS.maximumRadiusMeters)
  ) {
    return `Approximate radius must be between ${LOCATION_DEFAULTS.minimumRadiusMeters} and ${LOCATION_DEFAULTS.maximumRadiusMeters} metres.`;
  }
  if (
    !Number.isFinite(location.initialZoom) ||
    location.initialZoom! < LOCATION_DEFAULTS.minimumZoom ||
    location.initialZoom! > LOCATION_DEFAULTS.maximumZoom
  ) {
    return `Initial zoom must be between ${LOCATION_DEFAULTS.minimumZoom} and ${LOCATION_DEFAULTS.maximumZoom}.`;
  }
  return undefined;
}

export function isPublicEventLocation(eventFormat: string): boolean {
  return eventFormat === "in-person" || eventFormat === "hybrid";
}

export function isPublicDirectoryLocation(presenceType: string): boolean {
  return presenceType === "physical" || presenceType === "physical-and-online";
}

export function searchOpenStreetMap(query: string): string {
  return `${MAP_PROVIDER.search}${encodeURIComponent(query.trim())}`;
}

export function openStreetMapLocationUrl(
  coordinates: MapCoordinates,
  zoom: number,
): string {
  return `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}#map=${zoom}/${coordinates.lat}/${coordinates.lng}`;
}
