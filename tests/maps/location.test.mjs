import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {isOpenStreetMapUrl} from "../../src/lib/maps/publicMapUrl.ts";

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

test("OpenStreetMap navigation URLs are recognized by host, not by substring", () => {
  for (const url of ["https://openstreetmap.org/", "https://www.openstreetmap.org/a", "https://tile.openstreetmap.org/", "//openstreetmap.org/", "https://OPENSTREETMAP.ORG./"]) {
    assert.equal(isOpenStreetMapUrl(url), true);
  }
  for (const url of [undefined, "/ne/events/", "https://example.org/openstreetmap.org", "https://openstreetmap.org.example.org/", "https://maps.google.com/"]) {
    assert.equal(isOpenStreetMapUrl(url), false);
  }
});

test("Event and Directory reuse their rail and render one immediate map followed by travel", async () => {
  for (const path of ["../../src/pages/[lang]/events/[slug].astro", "../../src/pages/[lang]/directory/[slug].astro"]) {
    const page = await read(path);
    const main = page.slice(page.indexOf("<main"), page.indexOf("</main>"));
    const rail = page.slice(page.indexOf("<ContentContextRail"), page.indexOf("</ContentContextRail>"));
    assert.doesNotMatch(main, /<LocationMap|<TravelHelp/);
    assert.equal((rail.match(/<LocationMap/g) ?? []).length, 1);
    assert.match(rail, /<LocationMap[\s\S]*location=\{publicMapLocation\}[\s\S]*immediate=\{true\}[\s\S]*showFullscreenControl=\{true\}[\s\S]*\/>[\s\S]*<TravelHelp/);
    assert.match(page, /isOpenStreetMapUrl\(/);
    assert.match(rail, /contextSidebar=\{true\}/);
    assert.match(rail, /<TravelHelp[^>]*defaultOpen=\{true\}/);
  }
  const rail = await read("../../src/components/content/ContentContextRail.astro");
  assert.match(rail, /max-width: 58rem[\s\S]*grid-column: 1 \/ -1/);
  assert.match(rail, /max-width: 38rem[\s\S]*grid-template-columns: 1fr/);
});

test("sidebar maps preserve original location panels and avoid generated duplicate content", async () => {
  const event = await read("../../src/pages/[lang]/events/[slug].astro");
  const directory = await read("../../src/pages/[lang]/directory/[slug].astro");
  assert.match(event, /<ContextRailPanel title=\{eventLabels\.venue\} accent="civic">[\s\S]*event\.venueName[\s\S]*\{address\}[\s\S]*<\/ContextRailPanel>\s*\)\}\s*\{publicMapLocation/);
  assert.match(directory, /<dt>\{directoryLabels\.location\}<\/dt>\s*<dd>\{locationLabel\}<\/dd>[\s\S]*<\/ContextRailPanel>\s*\{publicMapLocation/);
  for (const page of [event, directory]) {
    const map = page.slice(page.indexOf("<LocationMap"), page.indexOf("/>", page.indexOf("<LocationMap")));
    assert.match(map, /title=\{additionalMapTitle\}/);
    assert.match(map, /caption=\{(?:event|listing)\.mapPresentation\?\.caption\}/);
    assert.match(map, /markerLabel=\{(?:event\.mapPresentation\?\.markerLabel \|\| event\.venueName \|\| eventLabels\.venue|listing\.mapPresentation\?\.markerLabel \|\| listing\.name)\}/);
    assert.match(page, /const additionalMapTitle = mapTitle && !\[[^\]]+\]\.includes\(mapTitle\) \? mapTitle : undefined/);
  }
  const renderer = await read("../../src/components/content/LocationMap.astro");
  assert.match(renderer, /!contextSidebar && title && <h2 class="location-map__title"/);
  assert.match(renderer, /!contextSidebar && <p class="location-map__description"/);
  assert.match(renderer, /!contextSidebar && <p class="location-map__external-notice"/);
  assert.match(renderer, /contextSidebar \? "" : labels\.exact/);
  assert.match(renderer, /precision === "approximate"\s*\?\s*`\$\{labels\.approximate\} · \$\{radiusText\(single!\)\}`/);
  assert.match(renderer, /caption \|\| safeSourceUrl \|\| precisionLabel/);
  assert.match(renderer, /\{caption && <span>\{caption\}<\/span>\}/);
  assert.match(renderer, /data-description=\{description\}/);
  for (const language of ["ne", "nb"]) {
    const wrapper = await read(`../../src/components/content/LocationMap${language === "ne" ? "Ne" : "Nb"}.astro`);
    assert.doesNotMatch(wrapper, /contextSidebar|defaultOpen|immediate=/);
  }
});

test("fullscreen control is below sidebar maps and above embedded maps with one rendered control", async () => {
  const renderer = await read("../../src/components/content/LocationMap.astro");
  const stage = renderer.indexOf('<div class="location-map__stage"');
  const before = renderer.slice(renderer.indexOf('<figure'), stage);
  const after = renderer.slice(stage, renderer.indexOf('<p\n        class="location-map__status"'));
  assert.match(before, /display\.showFullscreenControl && !contextSidebar && \(/);
  assert.equal((before.match(/data-map-fullscreen-open/g) ?? []).length, 1);
  assert.match(after, /<\/div>\s*<\/div>\s*\{display\.showFullscreenControl && contextSidebar && \(/);
  assert.equal((after.match(/data-map-fullscreen-open/g) ?? []).length, 1);
  assert.match(after, /\{labels\.viewMapFullscreen\}/);
  assert.match(after, /data-map-fullscreen-open[\s\S]*<MapPrivacy language=\{language\}/);
});

test("sidebar spacing hides only empty rows and uses compact card and travel gaps without resizing the map", async () => {
  const renderer = await read("../../src/components/content/LocationMap.astro");
  const rail = await read("../../src/components/content/ContentContextRail.astro");
  assert.match(renderer, /\.location-map\.location-map--context\s*\{\s*padding-bottom: 1\.125rem/);
  assert.match(renderer, /\.location-map--context \.location-map__status:empty/);
  assert.match(renderer, /\.location-map--context \.location-map__actions\s*\{\s*display: contents/);
  assert.match(rail, /\.context-map\)[\s\S]*?gap: 1\.375rem/);
  assert.match(rail, /\.context-map \.travel-help\)[\s\S]*?margin-block: 0/);
  assert.match(renderer, /height: clamp\(18rem, 55vw, 32rem\);\s*min-height: 18rem/);
});

test("shared map retains interactive controls and attribution without OSM navigation", async () => {
  const map = await read("../../src/components/content/LocationMap.astro");
  for (const control of ["data-map-zoom-in", "data-map-zoom-out", "data-map-fullscreen-open", "marker.bindPopup", "marker.bindTooltip", "data-attribution={MAP_PROVIDER.attribution}"]) assert.ok(map.includes(control));
  assert.match(map, /data-map-immediate/);
  assert.match(map, /dataset\.mapImmediate === "true"/);
  assert.match(map, /isOpenStreetMapUrl\(sourceUrl\)/);
  assert.doesNotMatch(map, /openStreetMapLocationUrl|data-map-osm-link|openStreetMapViewUrl|fixTheMapUrl/);
  assert.match(MAP_PROVIDER.attribution, /openstreetmap\.org\/copyright/);
});

test("Event and Directory presentation has no second location model or multi-stop route authoring", async () => {
  const schema = await read("../../sanity/schemaTypes/mapLocation.ts");
  const presentation = schema.slice(schema.indexOf("export const mapPresentation"), schema.indexOf("export const locationMap"));
  for (const field of ["title", "markerLabel", "caption", "markerIcon", "markerShowLabel", "editorialPath"]) {
    assert.ok(presentation.includes(`name: '${field}'`));
  }
  assert.doesNotMatch(presentation, /name: '(?:coordinates|locations|location|route|initialZoom|precision|radiusMeters)'/);
  assert.match(schema, /name: 'initialZoom'/);
  assert.match(schema, /name: 'precision'/);
  const editor = await read("../../sanity/components/MapPathInput.tsx");
  assert.match(editor, /useFormValue\(\['mapLocation'\]\)/);
  for (const query of [EVENT_BY_SLUG_QUERY, DIRECTORY_LISTING_BY_SLUG_QUERY]) {
    assert.match(query, /mapLocation \{coordinates, precision, radiusMeters, initialZoom\}/);
    assert.match(query, /mapPresentation \{\.\.\., editorialPath \{\.\.\.\}\}/);
  }
});

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
  assert.doesNotMatch(renderer, /openStreetMapLocationUrl|data-map-osm-link/);
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
