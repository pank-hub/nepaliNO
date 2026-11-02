import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  MAP_PROVIDER,
  PLACE_ICONS,
  ROUTING_PROVIDER,
} from "../../src/lib/maps/location.ts";
import { placeContent } from "../../src/lib/maps/markerIcons.ts";
import {
  LEGACY_PLACE_KEY,
  decodePolyline6,
  isLegacyBlock,
  isRouteEligible,
  isRouteStale,
  normalizePlaces,
  parseOsrmRoute,
  placesBounds,
  publicRoute,
  routeRequestUrl,
  routeStopsSignature,
  validPlaces,
  validatePlace,
  validatePlaces,
  validateRoute,
} from "../../src/lib/maps/places.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const exact = (key, lat, lng, extra = {}) => ({
  _key: key,
  label: `Place ${key}`,
  coordinates: { lat, lng },
  precision: "exact",
  icon: "pin",
  ...extra,
});
const area = (key, lat, lng, radiusMeters = 1000) => ({
  _key: key,
  label: `Area ${key}`,
  coordinates: { lat, lng },
  precision: "approximate",
  radiusMeters,
});
const fixture = JSON.parse(
  await read("../../src/lib/maps/dev/fixtureRoute.json"),
);
const fixturePlaces = [
  exact("oslo-s", 59.9111, 10.7528),
  exact("frogner", 59.927, 10.7011),
  exact("aker-brygge", 59.9139, 10.7389),
];
const fixtureKeys = fixturePlaces.map((place) => place._key);
const freshRoute = { enabled: true, stopKeys: fixtureKeys, ...fixture };

test("legacy single locations normalize to one place without rewriting content", () => {
  const legacy = {
    title: "Old map",
    location: {
      coordinates: { lat: 0, lng: 0 },
      precision: "exact",
      initialZoom: 14,
    },
  };
  const places = normalizePlaces(legacy, "Fallback");
  assert.equal(places.length, 1);
  assert.equal(places[0]._key, LEGACY_PLACE_KEY);
  assert.equal(places[0].label, "Old map");
  assert.deepEqual(places[0].coordinates, { lat: 0, lng: 0 });
  assert.equal(isLegacyBlock(legacy), true);
  assert.equal(
    normalizePlaces({ location: legacy.location }, "Fallback")[0].label,
    "Fallback",
  );
  assert.deepEqual(normalizePlaces({}, "x"), []);
  assert.equal("locations" in legacy, false);
});

test("new locations take precedence over a legacy location", () => {
  const block = {
    location: {
      coordinates: { lat: 1, lng: 1 },
      precision: "exact",
      initialZoom: 10,
    },
    locations: [exact("a", 59, 10)],
  };
  assert.equal(normalizePlaces(block)[0]._key, "a");
  assert.equal(isLegacyBlock(block), false);
});

test("place validation covers keys, labels, coordinates, precision, radius and icons", () => {
  assert.equal(validatePlace(exact("a", 0, 0)), undefined);
  assert.match(validatePlace({ ...exact("a", 1, 1), _key: undefined }), /key/);
  assert.match(validatePlace(exact("a", 1, 1, { label: "  " })), /label/);
  assert.match(validatePlace(exact("a", 91, 1)), /Latitude/);
  assert.match(validatePlace(exact("a", 1, Number.NaN)), /finite/);
  assert.match(
    validatePlace(exact("a", 1, 1, { precision: "wide" })),
    /precision/,
  );
  assert.match(validatePlace(area("a", 1, 1, 10)), /radius/);
  assert.match(validatePlace(area("a", 1, 1, 100_001)), /radius/);
  assert.equal(validatePlace(area("a", 1, 1, 50)), undefined);
  assert.match(
    validatePlace(exact("a", 1, 1, { icon: "<svg onload=x>" })),
    /Icon/,
  );
  assert.equal(validatePlace(exact("a", 1, 1, { icon: undefined })), undefined);
});

test("exactly the seven approved icons are allowed", () => {
  assert.deepEqual(
    [...PLACE_ICONS],
    ["pin", "home", "parking", "restaurant", "hospital", "airport", "warning"],
  );
  for (const icon of PLACE_ICONS) {
    assert.equal(validatePlace(exact("a", 1, 1, { icon })), undefined);
  }
});

test("duplicate and missing keys are rejected and invalid places are dropped from rendering", () => {
  const duplicate = [exact("a", 1, 1), exact("a", 2, 2)];
  assert.match(validatePlaces(duplicate), /duplicate key/);
  assert.equal(validatePlaces([exact("a", 1, 1), exact("b", 2, 2)]), undefined);
  assert.equal(validPlaces(duplicate).length, 1);
  assert.equal(validPlaces([exact("a", 1, 1), exact("b", 200, 2)]).length, 1);
});

test("reordering keeps stable keys but marks a route stale", () => {
  const reordered = [...fixturePlaces].reverse();
  assert.deepEqual(
    reordered.map((place) => place._key).sort(),
    [...fixtureKeys].sort(),
  );
  assert.equal(isRouteStale(freshRoute, fixturePlaces), false);
  assert.equal(
    isRouteStale(
      { ...freshRoute, stopKeys: [...fixtureKeys].reverse() },
      fixturePlaces,
    ),
    true,
  );
});

test("bounds contain markers and the full extent of approximate circles", () => {
  assert.equal(placesBounds([]), undefined);
  const single = placesBounds([exact("a", 59.9, 10.7)]);
  assert.deepEqual([single.south, single.north], [59.9, 59.9]);
  const mixed = placesBounds([
    exact("a", 59.9, 10.7),
    area("b", 60.0, 10.9, 5000),
  ]);
  assert.ok(mixed.north > 60.0 + 0.04, "circle radius extends north");
  assert.ok(mixed.south <= 59.9);
  assert.ok(mixed.east > 10.9, "circle radius extends east");
  const zero = placesBounds([exact("a", 0, 0)]);
  assert.deepEqual([zero.south, zero.west], [0, 0]);
});

test("only valid exact locations are route-eligible", () => {
  assert.equal(isRouteEligible(exact("a", 1, 1)), true);
  assert.equal(isRouteEligible(area("b", 1, 1)), false);
  assert.equal(isRouteEligible(exact("c", 99, 1)), false);
  assert.equal(isRouteEligible(undefined), false);
  const places = [exact("a", 1, 1), area("b", 2, 2)];
  assert.match(
    validateRoute({ enabled: true, stopKeys: ["a", "b"] }, places),
    /exact/,
  );
  assert.match(
    validateRoute({ enabled: true, stopKeys: ["a"] }, places),
    /at least two/,
  );
  assert.match(
    validateRoute({ enabled: true, stopKeys: ["a", "gone"] }, places),
    /no longer exists/,
  );
  assert.match(
    validateRoute({ enabled: true, stopKeys: ["a", "a"] }, places),
    /once/,
  );
});

test("saved route validation, staleness and public eligibility", () => {
  assert.equal(validateRoute(undefined, fixturePlaces), undefined);
  assert.equal(validateRoute({ enabled: false }, fixturePlaces), undefined);
  assert.equal(validateRoute(freshRoute, fixturePlaces), undefined);
  assert.equal(publicRoute(freshRoute, fixturePlaces).points.length > 10, true);

  const moved = fixturePlaces.map((place) =>
    place._key === "frogner" ? exact("frogner", 59.93, 10.7011) : place,
  );
  assert.equal(isRouteStale(freshRoute, moved), true);
  assert.match(validateRoute(freshRoute, moved), /out of date/);
  assert.equal(publicRoute(freshRoute, moved), undefined);

  assert.match(
    validateRoute({ ...freshRoute, geometry: undefined }, fixturePlaces),
    /Calculate/,
  );
  assert.match(
    validateRoute({ ...freshRoute, geometry: "not valid!" }, fixturePlaces),
    /invalid/,
  );
  assert.match(
    validateRoute({ ...freshRoute, calculatedAt: "nope" }, fixturePlaces),
    /incomplete/,
  );
  assert.match(
    validateRoute(
      { ...freshRoute, stopKeys: ["oslo-s", "frogner"] },
      fixturePlaces,
    ),
    /out of date/,
  );
  assert.equal(
    publicRoute({ ...freshRoute, enabled: false }, fixturePlaces),
    undefined,
  );
});

test("signature changes with stop order and coordinates but not unrelated places", () => {
  const base = routeStopsSignature(fixturePlaces, fixtureKeys);
  assert.equal(base, fixture.stopsSignature);
  assert.equal(
    routeStopsSignature([...fixturePlaces, area("x", 1, 1)], fixtureKeys),
    base,
  );
  assert.notEqual(
    routeStopsSignature(fixturePlaces, [...fixtureKeys].reverse()),
    base,
  );
  assert.equal(routeStopsSignature(fixturePlaces, ["missing"]), undefined);
});

test("polyline decoding returns real road geometry and rejects bad input", () => {
  const points = decodePolyline6(fixture.geometry);
  assert.ok(points.length > 100, "road-following geometry has many vertices");
  for (const [lat, lng] of points) {
    assert.ok(lat > 59.7 && lat < 60.1 && lng > 10.4 && lng < 11.0);
  }
  assert.throws(() => decodePolyline6("bad polyline"), /Invalid/);
  assert.throws(() => decodePolyline6("_"), /Truncated/);
});

test("routing response parsing never accepts a missing, failed or oversized route", () => {
  const ok = parseOsrmRoute({
    code: "Ok",
    routes: [{ geometry: fixture.geometry, distance: 1234.4, duration: 99.6 }],
  });
  assert.deepEqual([ok.distanceMeters, ok.durationSeconds], [1234, 100]);
  assert.throws(() => parseOsrmRoute({ code: "NoRoute", routes: [] }));
  assert.throws(() => parseOsrmRoute({ code: "Ok", routes: [] }));
  assert.throws(() =>
    parseOsrmRoute({
      code: "Ok",
      routes: [
        {
          geometry: "?".repeat(ROUTING_PROVIDER.maxGeometryLength + 1),
          distance: 1,
          duration: 1,
        },
      ],
    }),
  );
  const url = routeRequestUrl([
    { lat: 59.9, lng: 10.7 },
    { lat: 60, lng: 5.3 },
  ]);
  assert.ok(url.startsWith("https://routing.openstreetmap.de/"));
  assert.ok(url.includes("10.7,59.9;5.3,60"));
  assert.ok(url.includes("geometries=polyline6"));
});

test("place text is inserted as text, never as HTML", () => {
  const created = [];
  const fakeDocument = {
    createElement(tag) {
      const element = {
        tag,
        children: [],
        style: {},
        textContent: "",
        append(...nodes) {
          this.children.push(...nodes);
        },
      };
      created.push(element);
      return element;
    },
  };
  const node = placeContent(
    { label: "<img src=x onerror=alert(1)>", description: "<b>bold</b>" },
    fakeDocument,
  );
  assert.equal(node.children[0].textContent, "<img src=x onerror=alert(1)>");
  assert.equal(node.children[1].textContent, "<b>bold</b>");
  assert.ok(created.every((element) => !("innerHTML" in element)));
});

test("public renderer never uses innerHTML for editor text or calls a routing service", async () => {
  const [renderer, icons, ne, nb] = await Promise.all([
    read("../../src/components/content/LocationMap.astro"),
    read("../../src/lib/maps/markerIcons.ts"),
    read("../../src/components/content/LocationMapNe.astro"),
    read("../../src/components/content/LocationMapNb.astro"),
  ]);
  const script = renderer.slice(renderer.indexOf("<script>"));
  assert.ok(!/innerHTML|insertAdjacentHTML|set:html/.test(renderer));
  assert.ok(
    !/fetch\(|XMLHttpRequest|routing\.openstreetmap\.de|ROUTING_PROVIDER\.endpoint/.test(
      script,
    ),
  );
  assert.ok(!/fetch\(|routing\.openstreetmap\.de/.test(ne + nb));
  // The only HTML string is the fixed icon badge; it takes no editor text.
  assert.ok(!/\$\{(place|label|description)/.test(icons));
  assert.ok(script.includes("bindPopup(placeContent("));
});

test("only the Studio route action contacts the routing provider", async () => {
  const studio = await read("../../sanity/components/MapRouteInput.tsx");
  assert.ok(studio.includes("routeRequestUrl"));
  assert.ok(studio.includes("minimumIntervalMs"));
  assert.ok(
    studio.includes("referrerPolicy: 'strict-origin-when-cross-origin'"),
  );
  for (const file of [
    "../../src/pages/[lang]/news/[slug].astro",
    "../../src/pages/[lang]/info/[slug].astro",
    "../../src/pages/[lang]/events/[slug].astro",
    "../../src/pages/[lang]/directory/[slug].astro",
  ]) {
    assert.ok(
      !/routing\.openstreetmap\.de|routeRequestUrl/.test(await read(file)),
      file,
    );
  }
});

test("OSM referrer policy is kept in the shared config, Studio editors and renderer", async () => {
  assert.equal(MAP_PROVIDER.referrerPolicy, "strict-origin-when-cross-origin");
  const [places, single, renderer] = await Promise.all([
    read("../../sanity/components/MapPlacesInput.tsx"),
    read("../../sanity/components/MapLocationInput.tsx"),
    read("../../src/components/content/LocationMap.astro"),
  ]);
  assert.ok(places.includes("referrerPolicy: MAP_PROVIDER.referrerPolicy"));
  assert.ok(single.includes("referrerPolicy: MAP_PROVIDER.referrerPolicy"));
  assert.ok(
    renderer.includes("data-referrer-policy={MAP_PROVIDER.referrerPolicy}"),
  );
});

test("approximate places render as circles with no centre marker, link or tooltip", async () => {
  const renderer = await read("../../src/components/content/LocationMap.astro");
  const script = renderer.slice(renderer.indexOf("<script>"));
  const circleBranch = script.slice(
    script.indexOf('place.precision === "approximate" && place.radius'),
    script.indexOf(
      "} else {",
      script.indexOf('place.precision === "approximate" && place.radius'),
    ),
  );
  assert.ok(circleBranch.includes("L.circle"));
  assert.ok(!/L\.marker|bindTooltip/.test(circleBranch));
  assert.ok(
    renderer.includes('place.precision === "exact" && ('),
    "per-item link only for exact",
  );
  assert.ok(
    renderer.includes("legacy && single && single.precision"),
    "block link only for single legacy exact",
  );
});

test("schema registers the new types, icon list, route and legacy-safe location field", async () => {
  const [index, schema] = await Promise.all([
    read("../../sanity/schemaTypes/index.ts"),
    read("../../sanity/schemaTypes/mapLocation.ts"),
  ]);
  assert.ok(index.includes("mapPlace") && index.includes("mapRoute"));
  assert.ok(
    schema.includes("name: 'locations'") && schema.includes("name: 'route'"),
  );
  assert.ok(
    schema.includes("hidden: ({value}) => !value"),
    "legacy location hidden when empty",
  );
  assert.ok(!/name: 'location',[\s\S]{0,200}rule\.required\(\)/.test(schema));
});

test("dev fixture is DEV-only and loads its route data lazily", async () => {
  const page = await read("../../src/pages/dev/location-map-test.astro");
  assert.ok(page.includes("export const prerender = false"));
  assert.ok(page.includes("if (!import.meta.env.DEV)"));
  assert.ok(
    page.includes('await import("../../lib/maps/dev/fixtureRoute.json")'),
  );
});

test("every icon choice yields a Leaflet icon, never undefined, and uses no editor text", async () => {
  const { createPlaceIcon } = await import("../../src/lib/maps/markerIcons.ts");
  class DefaultIcon {}
  const L = {
    Icon: { Default: DefaultIcon },
    divIcon: (options) => ({ divIcon: true, ...options }),
  };
  assert.ok(createPlaceIcon(L, "pin") instanceof DefaultIcon);
  assert.ok(createPlaceIcon(L, undefined) instanceof DefaultIcon);
  assert.ok(createPlaceIcon(L, "<script>") instanceof DefaultIcon);
  for (const icon of PLACE_ICONS.filter((value) => value !== "pin")) {
    const result = createPlaceIcon(L, icon);
    assert.equal(result.divIcon, true, icon);
    assert.ok(result.html.includes("<svg") && !result.html.includes("<script"));
  }
});

test("route calculation is disabled by default and guarded before any fetch", async () => {
  const { ROUTING_CALCULATION_ENABLED } =
    await import("../../src/lib/maps/location.ts");
  assert.equal(ROUTING_CALCULATION_ENABLED, false);
  const { readFileSync } = await import("node:fs");
  const source = readFileSync("sanity/components/MapRouteInput.tsx", "utf8");
  assert.ok(
    source.indexOf("!ROUTING_CALCULATION_ENABLED ||") <
      source.indexOf("await fetch("),
  );
  assert.match(source, /disabled=\{!ROUTING_CALCULATION_ENABLED/);
  for (const file of [
    "src/components/content/LocationMap.astro",
    "src/pages/dev/location-map-test.astro",
  ]) {
    assert.doesNotMatch(
      readFileSync(file, "utf8"),
      /routeRequestUrl|routing\.openstreetmap\.de\/routed/,
    );
  }
});
