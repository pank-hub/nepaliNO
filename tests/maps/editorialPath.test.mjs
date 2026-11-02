import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  EDITORIAL_PATH_LIMITS,
  MAP_PROVIDER,
  PATH_COLORS,
  ROUTING_CALCULATION_ENABLED,
} from "../../src/lib/maps/location.ts";
import {
  editorialPathNeedsReview,
  extendBoundsWithPoints,
  placesBounds,
  placesSignature,
  publicEditorialPath,
  validatePlace,
  validateEditorialPath,
} from "../../src/lib/maps/places.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const pts = (...pairs) => pairs.map(([lat, lng]) => ({ lat, lng }));
const path = (extra = {}) => ({
  enabled: true,
  points: pts([59.9, 10.7], [59.95, 10.8]),
  ...extra,
});
const exact = (key, lat, lng) => ({
  _key: key,
  label: key,
  coordinates: { lat, lng },
  precision: "exact",
});

test("valid enabled path passes; disabled or absent never blocks", () => {
  assert.equal(validateEditorialPath(path()), undefined);
  assert.equal(
    validateEditorialPath({ enabled: false, points: [] }),
    undefined,
  );
  assert.equal(validateEditorialPath(undefined), undefined);
});

test("minimum and maximum point counts are enforced", () => {
  assert.match(
    validateEditorialPath(path({ points: pts([1, 1]) })),
    /at least 2/,
  );
  assert.match(
    validateEditorialPath(path({ points: undefined })),
    /at least 2/,
  );
  const many = Array.from(
    { length: EDITORIAL_PATH_LIMITS.maximumPoints },
    (_, i) => ({
      lat: 50 + i / 1000,
      lng: 10,
    }),
  );
  assert.equal(validateEditorialPath(path({ points: many })), undefined);
  assert.match(
    validateEditorialPath(path({ points: [...many, { lat: 60, lng: 11 }] })),
    /at most 500/,
  );
});

test("coordinates are range-checked, finite, and zero is valid", () => {
  assert.equal(
    validateEditorialPath(path({ points: pts([0, 0], [0, 1]) })),
    undefined,
  );
  for (const bad of [
    [91, 0],
    [0, 181],
    [NaN, 0],
    [0, Infinity],
  ]) {
    assert.ok(
      validateEditorialPath(path({ points: pts([1, 1], bad) })),
      String(bad),
    );
  }
  assert.ok(
    validateEditorialPath(
      path({
        points: [
          { lat: "1", lng: 2 },
          { lat: 3, lng: 4 },
        ],
      }),
    ),
  );
});

test("consecutive duplicate points are rejected", () => {
  assert.match(
    validateEditorialPath(path({ points: pts([1, 1], [1, 1]) })),
    /identical/,
  );
});

test("only supported colours and styles are accepted", () => {
  for (const color of Object.keys(PATH_COLORS)) {
    assert.equal(validateEditorialPath(path({ color })), undefined);
  }
  for (const style of ["solid", "dashed"]) {
    assert.equal(validateEditorialPath(path({ style })), undefined);
  }
  assert.ok(validateEditorialPath(path({ color: "#ff0000" })));
  assert.ok(validateEditorialPath(path({ color: "toString" })));
  assert.ok(validateEditorialPath(path({ style: "dotted" })));
  assert.ok(validateEditorialPath(path({ label: "x".repeat(121) })));
});

test("public path is normalized data; invalid or disabled yields nothing (no straight line)", () => {
  const result = publicEditorialPath(
    path({ color: "red", style: "dashed", label: " Route " }),
  );
  assert.deepEqual(result.points, [
    [59.9, 10.7],
    [59.95, 10.8],
  ]);
  assert.equal(result.color, PATH_COLORS.red);
  assert.ok(result.dashArray);
  assert.equal(result.label, "Route");
  assert.equal(
    publicEditorialPath(path({ style: "solid" })).dashArray,
    undefined,
  );
  assert.equal(publicEditorialPath(path()).color, PATH_COLORS.blue);
  assert.equal(publicEditorialPath(path({ points: pts([1, 1]) })), undefined);
  assert.equal(
    publicEditorialPath({ enabled: false, points: path().points }),
    undefined,
  );
  assert.equal(publicEditorialPath(undefined), undefined);
});

test("bounds can include both locations and path points", () => {
  const bounds = placesBounds([exact("a", 59.9, 10.7), exact("b", 60.0, 11.0)]);
  const all = extendBoundsWithPoints(bounds, [
    [59.5, 10.0],
    [60.2, 11.5],
  ]);
  assert.deepEqual(all, { south: 59.5, north: 60.2, west: 10.0, east: 11.5 });
});

test("changed location coordinates warn but never alter the path", () => {
  const places = [exact("a", 59.9, 10.7), exact("b", 60, 11)];
  const saved = path({ locationsSignature: placesSignature(places) });
  assert.equal(editorialPathNeedsReview(saved, places), false);
  const moved = [exact("a", 59.91, 10.7), exact("b", 60, 11)];
  assert.equal(editorialPathNeedsReview(saved, moved), true);
  assert.equal(editorialPathNeedsReview(path(), moved), false);
  assert.equal(saved.points.length, 2);
});

test("showLabel is an optional boolean on places", () => {
  assert.equal(
    validatePlace({ ...exact("a", 1, 1), icon: "pin", showLabel: false }),
    undefined,
  );
  assert.equal(
    validatePlace({ ...exact("a", 1, 1), showLabel: undefined }),
    undefined,
  );
  assert.ok(validatePlace({ ...exact("a", 1, 1), showLabel: "yes" }));
});

test("renderer draws the saved path with safe DOM text, no routing calls, same referrer policy", async () => {
  const renderer = await read("../../src/components/content/LocationMap.astro");
  assert.ok(renderer.includes("publicEditorialPath"));
  assert.ok(renderer.includes("data-path"));
  assert.ok(renderer.includes("permanent: place.showLabel !== false"));
  assert.ok(!renderer.includes("innerHTML"));
  assert.ok(
    !/routing\.openstreetmap\.de|routeRequestUrl|fetch\(/.test(renderer),
  );
  assert.equal(MAP_PROVIDER.referrerPolicy, "strict-origin-when-cross-origin");
  assert.ok(renderer.includes("data-referrer-policy"));
  for (const wrapper of ["Ne", "Nb"]) {
    const source = await read(
      `../../src/components/content/LocationMap${wrapper}.astro`,
    );
    assert.ok(source.includes("editorialPath={node.editorialPath}"));
  }
});

test("Studio path editor makes no routing request and uses the shared tile referrer policy", async () => {
  const input = await read("../../sanity/components/MapPathInput.tsx");
  assert.ok(
    !/fetch\(|routing\.openstreetmap\.de|routeRequestUrl|ROUTING_PROVIDER/.test(
      input,
    ),
  );
  assert.ok(input.includes("MAP_PROVIDER.referrerPolicy"));
  assert.ok(input.includes("window.confirm"));
  assert.equal(ROUTING_CALCULATION_ENABLED, false);
});

test("schema registers the path separately from the automatic route", async () => {
  const schema = await read("../../sanity/schemaTypes/mapLocation.ts");
  const index = await read("../../sanity/schemaTypes/index.ts");
  assert.match(schema, /name: 'mapEditorialPath'/);
  assert.match(schema, /name: 'editorialPath',[\s\S]*type: 'mapEditorialPath'/);
  assert.match(schema, /name: 'route',[\s\S]*type: 'mapRoute'/);
  assert.ok(index.includes("mapEditorialPath"));
});

test("fixture editorial example is dev-only", async () => {
  const page = await read("../../src/pages/dev/location-map-test.astro");
  assert.ok(page.includes("editorialPath={{"));
  assert.ok(page.includes("if (!import.meta.env.DEV)"));
  assert.ok(page.includes("export const prerender = false"));
});

test("automatic route editor is hidden while the flag is false; stored data still renders", async () => {
  const schema = await read("../../sanity/schemaTypes/mapLocation.ts");
  assert.match(
    schema,
    /name: 'route',[\s\S]*?hidden: \(\) => !ROUTING_CALCULATION_ENABLED/,
  );
  const renderer = await read("../../src/components/content/LocationMap.astro");
  assert.ok(renderer.includes("publicRoute("));
});

test("sitemap excludes the dev-only fixture path", async () => {
  const config = await read("../../astro.config.mjs");
  assert.match(config, /translations\|api\|dev/);
});
