import type { DivIcon, Icon, IconOptions } from "leaflet";

import type { MapPlace, PlaceIcon } from "./location.ts";

type LeafletModule = typeof import("leaflet");

// Fixed internal glyphs only. Editor text never reaches this markup.
const GLYPHS: Record<
  Exclude<PlaceIcon, "pin">,
  { colour: string; svg: string }
> = {
  home: {
    colour: "#1d4ed8",
    svg: '<path fill="#fff" d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/>',
  },
  parking: {
    colour: "#1e40af",
    svg: '<text x="12" y="18" text-anchor="middle" font-size="16" font-weight="700" font-family="Arial,sans-serif" fill="#fff">P</text>',
  },
  restaurant: {
    colour: "#b45309",
    svg: '<path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" d="M7 3v7M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 10v11M17 21V3c-2.5 2-3.5 5-3.5 8H17"/>',
  },
  hospital: {
    colour: "#b91c1c",
    svg: '<path fill="#fff" d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  },
  airport: {
    colour: "#0f766e",
    svg: '<path fill="#fff" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>',
  },
  warning: {
    colour: "#facc15",
    svg: '<path fill="#1f2937" d="M12 3 1.5 21h21z"/><path fill="#facc15" d="M11 9h2v6h-2zM11 16.5h2v2h-2z"/>',
  },
};

export const PLACE_ICON_SIZE = 32;

/**
 * Returns a Leaflet icon for an exact place. `pin` (and any unknown value)
 * is Leaflet's default marker, so the verified single-location look is unchanged.
 * Always returns an icon: passing `icon: undefined` to L.marker breaks it.
 */
export function createPlaceIcon(
  L: LeafletModule,
  icon: PlaceIcon | undefined,
): Icon<IconOptions> | DivIcon {
  if (!icon || icon === "pin" || !(icon in GLYPHS)) return new L.Icon.Default();
  const glyph = GLYPHS[icon];
  return L.divIcon({
    className: "map-place-icon",
    iconSize: [PLACE_ICON_SIZE, PLACE_ICON_SIZE],
    iconAnchor: [PLACE_ICON_SIZE / 2, PLACE_ICON_SIZE / 2],
    tooltipAnchor: [PLACE_ICON_SIZE / 2, 0],
    popupAnchor: [0, -PLACE_ICON_SIZE / 2],
    html: `<span style="display:flex;width:${PLACE_ICON_SIZE}px;height:${PLACE_ICON_SIZE}px;align-items:center;justify-content:center;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);background:${glyph.colour}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">${glyph.svg}</svg></span>`,
  });
}

/** DOM-built content so editor text is always treated as text, never HTML. */
export function placeContent(place: MapPlace, document: Document): HTMLElement {
  const wrapper = document.createElement("div");
  const label = document.createElement("strong");
  label.textContent = place.label ?? "";
  wrapper.append(label);
  if (place.description) {
    const description = document.createElement("p");
    description.style.margin = "0.25rem 0 0";
    description.textContent = place.description;
    wrapper.append(description);
  }
  return wrapper;
}

export function labelContent(label: string, document: Document): HTMLElement {
  const element = document.createElement("span");
  element.textContent = label;
  return element;
}
