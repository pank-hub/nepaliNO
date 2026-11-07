import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  LOCATION_DEFAULTS,
  MAP_PROVIDER,
  isPublicDirectoryLocation,
  isPublicEventLocation,
  openStreetMapLocationUrl,
  searchOpenStreetMap,
  validateCoordinates,
  validateMapLocation,
} from "../../src/lib/maps/location.ts";
import {
  ACTIVE_DIRECTORY_LISTINGS_BY_LANGUAGE_QUERY,
  DIRECTORY_LISTING_BY_SLUG_QUERY,
  EVENT_BY_SLUG_QUERY,
  HOMEPAGE_EVENTS_BY_LANGUAGE_QUERY,
  NEWS_ARTICLE_BY_SLUG_QUERY,
  PAST_EVENTS_BY_LANGUAGE_QUERY,
  PUBLIC_INFORMATION_GUIDE_BY_SLUG_QUERY,
  UPCOMING_EVENTS_BY_LANGUAGE_QUERY,
} from "../../src/lib/sanity/queries.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("coordinates accept zero and reject non-finite or out-of-range values", () => {
  assert.equal(validateCoordinates({ lat: 0, lng: 0 }), undefined);
  assert.equal(validateCoordinates({ lat: -90, lng: 180 }), undefined);
  assert.equal(validateCoordinates({ lat: 90, lng: -180 }), undefined);
  assert.match(validateCoordinates(undefined), /Choose a map location/);
  assert.match(validateCoordinates({ lat: Number.NaN, lng: 0 }), /finite/);
  assert.match(
    validateCoordinates({ lat: Number.POSITIVE_INFINITY, lng: 0 }),
    /finite/,
  );
  assert.match(validateCoordinates({ lat: 90.01, lng: 0 }), /Latitude/);
  assert.match(validateCoordinates({ lat: 0, lng: -180.01 }), /Longitude/);
});

test("location validation distinguishes exact pins and bounded approximate areas", () => {
  const exact = {
    coordinates: { lat: 0, lng: 0 },
    precision: "exact",
    initialZoom: LOCATION_DEFAULTS.exactZoom,
  };
  assert.equal(validateMapLocation(exact), undefined);
  assert.equal(
    validateMapLocation({
      ...exact,
      precision: "approximate",
      radiusMeters: LOCATION_DEFAULTS.minimumRadiusMeters,
    }),
    undefined,
  );
  for (const radiusMeters of [
    LOCATION_DEFAULTS.minimumRadiusMeters - 1,
    LOCATION_DEFAULTS.maximumRadiusMeters + 1,
    Number.NaN,
  ]) {
    assert.match(
      validateMapLocation({ ...exact, precision: "approximate", radiusMeters }),
      /radius/,
    );
  }
  assert.match(validateMapLocation({ ...exact, initialZoom: 0 }), /zoom/);
  assert.match(validateMapLocation({ ...exact, initialZoom: 20 }), /zoom/);
  assert.match(
    validateMapLocation({ ...exact, precision: "unknown" }),
    /precision/,
  );
  assert.match(
    validateMapLocation({ ...exact, precision: undefined }),
    /precision/,
  );
});

test("OpenStreetMap endpoints are centralized and explicit searches encode user input", () => {
  assert.equal(
    MAP_PROVIDER.tiles,
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  );
  assert.match(MAP_PROVIDER.attribution, /openstreetmap\.org\/copyright/);
  assert.equal(
    searchOpenStreetMap("  Oslo Central Station  "),
    "https://www.openstreetmap.org/search?query=Oslo%20Central%20Station",
  );
  assert.match(
    openStreetMapLocationUrl({ lat: 0, lng: 0 }, 15),
    /mlat=0&mlon=0#map=15\/0\/0/,
  );
});

test("only public physical Events and Directory locations are eligible for maps", () => {
  assert.equal(isPublicEventLocation("in-person"), true);
  assert.equal(isPublicEventLocation("hybrid"), true);
  assert.equal(isPublicEventLocation("online"), false);
  assert.equal(isPublicDirectoryLocation("physical"), true);
  assert.equal(isPublicDirectoryLocation("physical-and-online"), true);
  assert.equal(isPublicDirectoryLocation("online-only"), false);
  assert.equal(isPublicDirectoryLocation("no-public-location"), false);
  assert.equal(validateMapLocation(undefined), "Choose a map location.");
});

test("detail queries project optional map data without requiring it for legacy records", () => {
  const eventQueries = [
    UPCOMING_EVENTS_BY_LANGUAGE_QUERY,
    PAST_EVENTS_BY_LANGUAGE_QUERY,
    HOMEPAGE_EVENTS_BY_LANGUAGE_QUERY,
    EVENT_BY_SLUG_QUERY,
  ];
  for (const query of eventQueries) {
    assert.match(
      query,
      /mapLocation\s*\{\s*coordinates,\s*precision,\s*radiusMeters,\s*initialZoom\s*\}/,
    );
  }
  for (const query of [
    ACTIVE_DIRECTORY_LISTINGS_BY_LANGUAGE_QUERY,
    DIRECTORY_LISTING_BY_SLUG_QUERY,
  ]) {
    assert.match(
      query,
      /mapLocation\s*\{\s*coordinates,\s*precision,\s*radiusMeters,\s*initialZoom\s*\}/,
    );
  }
  assert.doesNotMatch(eventQueries.join("\n"), /defined\(mapLocation\)/);
  assert.doesNotMatch(
    [
      ACTIVE_DIRECTORY_LISTINGS_BY_LANGUAGE_QUERY,
      DIRECTORY_LISTING_BY_SLUG_QUERY,
    ].join("\n"),
    /defined\(mapLocation\)/,
  );
  assert.match(
    PUBLIC_INFORMATION_GUIDE_BY_SLUG_QUERY,
    /body\[\]\s*\{[\s\S]*?\.\.\./,
  );
  assert.match(NEWS_ARTICLE_BY_SLUG_QUERY, /body\[\]\s*\{[\s\S]*?\.\.\./);
});

test("location block is shared by News and Guides and the renderer defers tile loading", async () => {
  const [
    newsSchema,
    guideSchema,
    eventSchema,
    directorySchema,
    eventPage,
    directoryPage,
    eventForm,
    directoryForm,
    renderer,
    studioInput,
    indexSchema,
    mapSchema,
  ] = await Promise.all([
    read("../../sanity/schemaTypes/newsArticle.ts"),
    read("../../sanity/schemaTypes/publicInformationGuide.ts"),
    read("../../sanity/schemaTypes/communityEvent.ts"),
    read("../../sanity/schemaTypes/directoryListing.ts"),
    read("../../src/pages/[lang]/events/[slug].astro"),
    read("../../src/pages/[lang]/directory/[slug].astro"),
    read("../../src/components/events/EventSubmissionForm.astro"),
    read("../../src/components/directory/DirectorySubmissionForm.astro"),
    read("../../src/components/content/LocationMap.astro"),
    read("../../sanity/components/MapLocationInput.tsx"),
    read("../../sanity/schemaTypes/index.ts"),
    read("../../sanity/schemaTypes/mapLocation.ts"),
  ]);

  assert.match(newsSchema, /defineArrayMember\(\{type: 'locationMap'\}\)/);
  assert.match(guideSchema, /defineArrayMember\(\{type: 'locationMap'\}\)/);
  assert.match(indexSchema, /locationMap/);
  assert.match(mapSchema, /name: 'coordinates'[\s\S]*?type: 'geopoint'/);
  assert.match(
    mapSchema,
    /name: 'accessibleDescription'[\s\S]*?rule\.required\(\)/,
  );
  assert.match(eventSchema, /name: 'mapLocation'[\s\S]*?type: 'mapLocation'/);
  assert.match(
    directorySchema,
    /name: 'mapLocation'[\s\S]*?type: 'mapLocation'/,
  );
  assert.match(eventSchema, /name: 'mapUrl'/);
  assert.match(directorySchema, /name: 'mapUrl'/);
  assert.doesNotMatch(eventForm, /mapLocation|coordinates/);
  assert.doesNotMatch(directoryForm, /mapLocation|coordinates/);
  assert.match(eventPage, /isPublicEventLocation\(event\.eventFormat\)/);
  assert.match(
    directoryPage,
    /isPublicDirectoryLocation\(listing\.presenceType\)/,
  );
  assert.match(studioInput, /onChange\(PatchEvent\.from\(unset\(\)\)\)/);
  assert.match(studioInput, /Only search public place information/);
  assert.match(
    studioInput,
    /No location is saved until a valid point is selected/,
  );
  assert.match(renderer, /data-map-load/);
  assert.match(renderer, /document\.addEventListener\("click"/);
  assert.match(renderer, /activeMaps\.set\(id, record\)/);
  assert.match(renderer, /activeMaps\.has\(id\)/);
  assert.match(renderer, /place\.precision === "approximate" && place\.radius/);
  assert.match(renderer, /L\.circle\(/);
  assert.match(renderer, /L\.marker\(/);
  const approximateStart = renderer.indexOf(
    'place.precision === "approximate" && place.radius',
  );
  const approximateBranch = renderer.slice(
    approximateStart,
    renderer.indexOf("} else {", approximateStart),
  );
  assert.doesNotMatch(approximateBranch, /L\.marker\(/);
  assert.match(renderer, /legacy && single && single\.precision === "exact"/);
  assert.match(renderer, /data-attribution=\{MAP_PROVIDER\.attribution\}/);
  assert.match(renderer, /astro:before-swap/);
  assert.doesNotMatch(renderer, /<img[^>]+(?:tile\.openstreetmap|data-tile)/);

  const activation = renderer.slice(
    renderer.indexOf("const activate = async"),
    renderer.indexOf("document.addEventListener"),
  );
  assert.match(activation, /await loadLeaflet\(\)/);
  assert.match(activation, /L\.tileLayer\(/);
  assert.match(renderer, /externalNotice/);
  assert.match(renderer, /data-map-canvas[\s\S]*?hidden/);
  assert.match(renderer, /catch \(error\)/);
  assert.match(renderer, /root\.dataset\.failedLabel/);
});

test("both tile layers send the shared strict-origin-when-cross-origin referrer policy", async () => {
  const [renderer, studioInput] = await Promise.all([
    read("../../src/components/content/LocationMap.astro"),
    read("../../sanity/components/MapLocationInput.tsx"),
  ]);
  assert.equal(MAP_PROVIDER.referrerPolicy, "strict-origin-when-cross-origin");
  assert.match(studioInput, /referrerPolicy: MAP_PROVIDER\.referrerPolicy/);
  assert.match(
    renderer,
    /data-referrer-policy=\{MAP_PROVIDER\.referrerPolicy\}/,
  );
  assert.match(renderer, /referrerPolicy: \(root\.dataset\.referrerPolicy/);
});

test("local map fixture is dev-only and uses the real renderer", async () => {
  const fixture = await read("../../src/pages/dev/location-map-test.astro");
  assert.match(fixture, /import\.meta\.env\.DEV/);
  assert.match(fixture, /status: 404/);
  assert.match(fixture, /prerender = false/);
  assert.match(fixture, /import LocationMap from/);
  assert.match(fixture, /precision: "exact"/);
  assert.match(fixture, /precision: "approximate"/);
});

test("Nepali, Norwegian and English fallback map controls are available", async () => {
  const [ne, nb, en] = await Promise.all([
    read("../../src/i18n/ne.ts"),
    read("../../src/i18n/nb.ts"),
    read("../../src/i18n/en.ts"),
  ]);
  for (const source of [ne, nb, en]) {
    assert.match(source, /maps:\s*\{/);
    assert.match(source, /externalNotice:/);
    assert.match(source, /openMapInOsm:/);
    assert.match(source, /approximateRadius:/);
    assert.match(source, /zoomIn:/);
    assert.match(source, /zoomOut:/);
  }
});
