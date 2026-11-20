export type MapStyleMode = "editorial" | "city";

export const MAP_VECTOR_PROVIDER = {
  styles: {
    editorial: "https://tiles.openfreemap.org/styles/positron",
    city: "https://tiles.openfreemap.org/styles/liberty",
  },
  attribution:
    '© <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
  referrerPolicy: "strict-origin-when-cross-origin",
  maxZoom: 19,
} as const;

interface StyleLayer {
  id: string;
  type?: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface VectorStyleSpec {
  version: number;
  layers: StyleLayer[];
  [key: string]: unknown;
}

const EDITORIAL_HIDDEN_LAYERS = new Set([
  "building",
  "highway-shield-non-us",
  "highway-shield-us-interstate",
  "road_shield_us",
]);

/**
 * Applies nepali.no's calm Nordic editorial palette over OpenFreeMap base styles.
 * - `editorial`: NRK-inspired uncluttered terrain, fjord blue water, no shop/building noise.
 * - `city`: full street names, buildings, and transit stations for urban navigation.
 */
export function customizeMapStyle(
  rawStyle: VectorStyleSpec,
  mode: MapStyleMode,
): VectorStyleSpec {
  const layers = (rawStyle.layers ?? []).map((layer) => {
    const next: StyleLayer = {
      ...layer,
      ...(layer.layout ? { layout: { ...layer.layout } } : {}),
      ...(layer.paint ? { paint: { ...layer.paint } } : {}),
    };

    if (mode === "editorial") {
      if (EDITORIAL_HIDDEN_LAYERS.has(layer.id)) {
        next.layout = { ...(next.layout ?? {}), visibility: "none" };
        return next;
      }
      if (layer.id === "background") {
        next.paint = { ...(next.paint ?? {}), "background-color": "#f6f5f0" };
      } else if (layer.id === "water") {
        next.paint = { ...(next.paint ?? {}), "fill-color": "#94c0eb" };
      } else if (layer.id === "waterway") {
        next.paint = { ...(next.paint ?? {}), "line-color": "#94c0eb" };
      } else if (layer.id === "park") {
        next.paint = { ...(next.paint ?? {}), "fill-color": "#dce8d5" };
      } else if (layer.id === "landcover_wood") {
        next.paint = { ...(next.paint ?? {}), "fill-color": "#d7e5cf" };
      } else if (layer.id === "landuse_residential") {
        next.paint = { ...(next.paint ?? {}), "fill-color": "#efede7" };
      } else if (
        layer.id === "highway_major_inner" ||
        layer.id === "highway_motorway_inner" ||
        layer.id === "highway_motorway_bridge_inner"
      ) {
        next.paint = { ...(next.paint ?? {}), "line-color": "#ffffff" };
      } else if (
        layer.id === "highway_minor" ||
        layer.id === "highway_major_casing" ||
        layer.id === "highway_motorway_casing" ||
        layer.id === "highway_motorway_bridge_casing"
      ) {
        next.paint = { ...(next.paint ?? {}), "line-color": "#e2dfd7" };
      } else if (layer.id === "boundary_2" || layer.id === "boundary_3") {
        next.paint = { ...(next.paint ?? {}), "line-color": "#a3aab4" };
      }
      return next;
    }

    // `city` mode: harmonize base tones with nepali.no while keeping streets, buildings, and transit crisp.
    if (layer.id === "background") {
      next.paint = { ...(next.paint ?? {}), "background-color": "#f7f5f0" };
    } else if (layer.id === "water") {
      next.paint = { ...(next.paint ?? {}), "fill-color": "#9cc6f0" };
    } else if (layer.id.startsWith("waterway_") && layer.type === "line") {
      next.paint = { ...(next.paint ?? {}), "line-color": "#9cc6f0" };
    } else if (layer.id === "park") {
      next.paint = { ...(next.paint ?? {}), "fill-color": "#dce8d5" };
    } else if (layer.id === "poi_r20" || layer.id === "poi_r7" || layer.id === "poi_r1") {
      next.paint = {
        ...(next.paint ?? {}),
        "icon-opacity": 0.78,
        "text-opacity": 0.85,
      };
    }
    return next;
  });

  return {
    ...rawStyle,
    layers,
  };
}
