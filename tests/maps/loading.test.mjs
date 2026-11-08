import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { openStreetMapViewUrl, resolveMapDisplaySettings } from "../../src/lib/maps/location.ts";
import { createMapFullscreen } from "../../src/lib/maps/mapFullscreen.ts";
import {
  createMapActivator,
  MAP_LAZY_ROOT_MARGIN,
  observeAutomaticMaps,
  setMapListLoaded,
} from "../../src/lib/maps/mapLoading.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("legacy display defaults and independent action settings", () => {
  assert.deepEqual(resolveMapDisplaySettings({}), {
    loadingBehavior: "click",
    showViewOnMapActions: true,
    showOpenStreetMapLinks: true,
    showLocationList: true,
    showOpenStreetMapControl: false,
    showFullscreenControl: false,
  });
  assert.deepEqual(
    resolveMapDisplaySettings({
      loadingBehavior: "automatic",
      showViewOnMapActions: false,
      showOpenStreetMapLinks: false,
      showLocationList: false,
      showOpenStreetMapControl: true,
      showFullscreenControl: true,
    }),
    {
      loadingBehavior: "automatic",
      showViewOnMapActions: false,
      showOpenStreetMapLinks: false,
      showLocationList: false,
      showOpenStreetMapControl: true,
      showFullscreenControl: true,
    },
  );
  assert.equal(
    resolveMapDisplaySettings({ showViewOnMapActions: false })
      .showOpenStreetMapLinks,
    true,
  );
  assert.equal(
    resolveMapDisplaySettings({ showOpenStreetMapLinks: false })
      .showViewOnMapActions,
    true,
  );
  assert.equal(
    resolveMapDisplaySettings({ loadingBehavior: "invalid" }).loadingBehavior,
    "click",
  );
  assert.equal(resolveMapDisplaySettings({ showLocationList: true }).showLocationList, true);
});

test("new block initial value and both language renderers pass the settings", async () => {
  const [schema, ne, nb] = await Promise.all([
    read("../../sanity/schemaTypes/mapLocation.ts"),
    read("../../src/components/content/LocationMapNe.astro"),
    read("../../src/components/content/LocationMapNb.astro"),
  ]);
  assert.match(
    schema,
    /export const locationMap = defineType\(\{[\s\S]*?initialValue:\s*\{\s*loadingBehavior: 'click',\s*showViewOnMapActions: false,\s*showOpenStreetMapLinks: false,\s*showLocationList: false,\s*showOpenStreetMapControl: false,\s*showFullscreenControl: true/,
  );
  for (const wrapper of [ne, nb]) {
    for (const field of [
      "loadingBehavior",
      "showViewOnMapActions",
      "showOpenStreetMapLinks",
      "showLocationList",
      "showOpenStreetMapControl",
      "showFullscreenControl",
    ]) {
      assert.ok(wrapper.includes(`${field}={node.${field}}`));
    }
  }
});

function fullscreenHarness() {
  class Node extends EventTarget {
    constructor(name) {
      super();
      this.name = name;
      this.parentNode = null;
      this.children = [];
    }
    contains(node) {
      return this === node || this.children.some((child) => child.contains(node));
    }
    insertBefore(node, before) {
      if (node.contains(this)) throw new Error("HierarchyRequestError");
      if (before && before.parentNode !== this) throw new Error("NotFoundError");
      if (node.parentNode) node.parentNode.children.splice(node.parentNode.children.indexOf(node), 1);
      const index = before ? this.children.indexOf(before) : this.children.length;
      this.children.splice(index, 0, node);
      node.parentNode = this;
      return node;
    }
    append(node) { this.insertBefore(node, null); }
    replaceChild(node, old) {
      this.insertBefore(node, old);
      this.children.splice(this.children.indexOf(old), 1);
      old.parentNode = null;
    }
    querySelector(selector) {
      for (const child of this.children) {
        if (child.selector === selector) return child;
        const found = child.querySelector(selector);
        if (found) return found;
      }
      return null;
    }
  }
  const style = (initial = "") => {
    let value = initial;
    let priority = initial ? "important" : "";
    return {
      getPropertyValue: () => value,
      getPropertyPriority: () => priority,
      setProperty: (_name, next, nextPriority = "") => { value = next; priority = nextPriority; },
      removeProperty: () => { value = ""; priority = ""; },
    };
  };
  const doc = new EventTarget();
  doc.body = { style: style("auto") };
  doc.documentElement = { style: style() };
  doc.createComment = () => new Node("placeholder");
  const win = new EventTarget();
  win.visualViewport = new EventTarget();
  const fullscreen = createMapFullscreen(doc, win);
  const makeMap = () => {
    const root = new Node("figure");
    const parent = root;
    const stage = new Node("stage");
    stage.selector = "[data-map-stage]";
    const opener = new Node("opener");
    opener.selector = "[data-map-fullscreen-open]";
    opener.isConnected = true;
    opener.focuses = 0;
    opener.focus = () => { opener.focuses++; };
    const exit = new Node("exit");
    exit.selector = "[data-map-fullscreen-exit]";
    exit.focuses = 0;
    exit.focus = () => { exit.focuses++; };
    const dialog = new Node("dialog");
    dialog.selector = "[data-map-fullscreen-dialog]";
    dialog.open = false;
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; };
    dialog.append(exit);
    root.append(opener);
    root.append(stage);
    root.append(dialog);
    const anchor = new Node("after");
    root.append(anchor);
    const layers = [{ kind: "marker", label: "direct label" }, { kind: "circle" }, { kind: "editorial path" }];
    const map = {
      layers,
      center: { lat: 59.9, lng: 10.7 },
      zoom: 12,
      invalidations: 0,
      getCenter() { return this.center; },
      getZoom() { return this.zoom; },
      invalidateSize(options) { assert.deepEqual(options, { pan: false, animate: false }); this.invalidations++; },
      setView(center, zoom, options) {
        assert.deepEqual(options, { animate: false });
        this.center = center;
        this.zoom = zoom;
      },
    };
    return { root, parent, stage, opener, exit, dialog, anchor, map, layers };
  };
  return { doc, win, fullscreen, makeMap };
}

test("fullscreen moves the existing map, preserves layers and view, locks scrolling and restores focus", () => {
  const { doc, win, fullscreen, makeMap } = fullscreenHarness();
  const first = makeMap();
  const second = makeMap();
  fullscreen.open(first.root, first.map);
  assert.equal(first.dialog.open, true);
  assert.equal(first.stage.parentNode, first.dialog);
  assert.deepEqual(first.root.children.map((node) => node.name), ["opener", "placeholder", "dialog", "after"]);
  assert.equal(first.exit.focuses, 1);
  assert.equal(doc.body.style.getPropertyValue("overflow"), "hidden");
  assert.equal(doc.documentElement.style.getPropertyValue("overflow"), "hidden");
  assert.equal(first.map.invalidations, 1);
  assert.equal(first.map.layers, first.layers);
  assert.equal(second.stage.parentNode, second.parent);
  first.map.center = { lat: 60, lng: 11 };
  first.map.zoom = 14;
  win.dispatchEvent(new Event("resize"));
  win.visualViewport.dispatchEvent(new Event("resize"));
  assert.deepEqual(first.map.center, { lat: 60, lng: 11 });
  assert.equal(first.map.zoom, 14);
  assert.equal(first.map.invalidations, 3);
  assert.equal(fullscreen.close(second.root), false);
  const escape = new Event("keydown", { cancelable: true });
  escape.key = "Escape";
  doc.dispatchEvent(escape);
  assert.equal(escape.defaultPrevented, true);
  assert.equal(first.dialog.open, false);
  assert.equal(first.stage.parentNode, first.parent);
  assert.deepEqual(first.root.children.map((node) => node.name), ["opener", "stage", "dialog", "after"]);
  assert.equal(first.map.invalidations, 4);
  assert.equal(first.map.layers, first.layers);
  assert.deepEqual(first.map.center, { lat: 60, lng: 11 });
  assert.equal(first.opener.focuses, 1);
  assert.equal(doc.body.style.getPropertyValue("overflow"), "auto");
  assert.equal(doc.body.style.getPropertyPriority("overflow"), "important");
  assert.equal(doc.documentElement.style.getPropertyValue("overflow"), "");
  win.dispatchEvent(new Event("resize"));
  assert.equal(first.map.invalidations, 4);
  fullscreen.open(second.root, second.map);
  assert.equal(second.dialog.open, true);
  assert.equal(first.dialog.open, false);
  second.dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
  assert.equal(second.dialog.open, false);
  assert.equal(second.opener.focuses, 1);
});

test("fullscreen handles exit, failure to open and cleanup without locking the page", () => {
  const { doc, fullscreen, makeMap } = fullscreenHarness();
  const first = makeMap();
  first.dialog.showModal = () => { throw new Error("unavailable"); };
  assert.throws(() => fullscreen.open(first.root, first.map), /unavailable/);
  assert.equal(first.stage.parentNode, first.parent);
  assert.deepEqual(first.root.children.map((node) => node.name), ["opener", "stage", "dialog", "after"]);
  assert.equal(doc.body.style.getPropertyValue("overflow"), "auto");
  assert.equal(first.opener.focuses, 1);
  first.dialog.showModal = () => { first.dialog.open = true; };
  fullscreen.open(first.root, first.map);
  const click = new Event("click");
  Object.defineProperty(click, "target", { value: first.exit });
  first.dialog.dispatchEvent(click);
  assert.equal(first.dialog.open, false);
  assert.equal(first.opener.focuses, 2);
  fullscreen.open(first.root, first.map);
  assert.equal(fullscreen.close(first.root, false), true);
  assert.equal(first.opener.focuses, 2);
  assert.equal(doc.body.style.getPropertyValue("overflow"), "auto");
});

test("fullscreen rejects circular hierarchy and repeats safely after partial failure", () => {
  const { doc, win, fullscreen, makeMap } = fullscreenHarness();
  const item = makeMap();
  item.stage.append(item.dialog);
  assert.throws(() => fullscreen.open(item.root, item.map), /incomplete/);
  assert.equal(item.stage.parentNode, item.root);
  item.root.insertBefore(item.dialog, item.anchor);
  const originalInvalidate = item.map.invalidateSize;
  let firstCall = true;
  item.map.invalidateSize = function (options) {
    if (firstCall) {
      firstCall = false;
      throw new Error("resize failed");
    }
    return originalInvalidate.call(this, options);
  };
  assert.throws(() => fullscreen.open(item.root, item.map), /resize failed/);
  assert.deepEqual(item.root.children.map((node) => node.name), ["opener", "stage", "dialog", "after"]);
  assert.equal(item.dialog.open, false);
  assert.equal(doc.body.style.getPropertyValue("overflow"), "auto");
  assert.equal(doc.documentElement.style.getPropertyValue("overflow"), "");
  const before = item.map.invalidations;
  win.dispatchEvent(new Event("resize"));
  assert.equal(item.map.invalidations, before);
  for (let i = 0; i < 3; i++) {
    fullscreen.open(item.root, item.map);
    assert.equal(item.stage.parentNode, item.dialog);
    fullscreen.close(item.root);
    assert.deepEqual(item.root.children.map((node) => node.name), ["opener", "stage", "dialog", "after"]);
    assert.equal(item.dialog.children.length, 1);
    assert.equal(doc.body.style.getPropertyValue("overflow"), "auto");
  }
});

test("fullscreen rendering keeps controls and attribution in the existing map without extra providers", async () => {
  const [renderer, helper, fixture, ne, nb] = await Promise.all([
    read("../../src/components/content/LocationMap.astro"),
    read("../../src/lib/maps/mapFullscreen.ts"),
    read("../../src/pages/dev/location-map-test.astro"),
    read("../../src/i18n/ne.ts"),
    read("../../src/i18n/nb.ts"),
  ]);
  assert.match(renderer, /<dialog[^>]*data-map-fullscreen-dialog[^>]*aria-label/);
  assert.match(renderer, /<div class="location-map__stage" data-map-stage>[\s\S]*?<\/div>\s*<\/div>\s*\{display\.showFullscreenControl && contextSidebar && \([\s\S]*?\)\}\s*\{contextSidebar && <MapPrivacy language=\{language\} \/>\}\s*\{display\.showFullscreenControl && \(\s*<dialog/);
  assert.match(renderer, /data-map-fullscreen-open[^>]*aria-haspopup="dialog"[^>]*hidden/);
  assert.match(renderer, /tiles\.once\("load"[\s\S]*?fullscreenButton\.hidden = false/);
  assert.match(renderer, /tiles\.on\("tileerror"[\s\S]*?fullscreen\.close\(root, false\)/);
  assert.match(renderer, /fullscreen\.close\(undefined, false\)/);
  assert.match(renderer, /data-map-fullscreen-exit/);
  assert.match(renderer, /height: 100dvh/);
  assert.match(renderer, /touch-action: none/);
  assert.match(renderer, /data-map-zoom-in/);
  assert.match(renderer, /attribution: root\.dataset\.attribution/);
  assert.equal((renderer.match(/L\.map\(/g) ?? []).length, 1);
  assert.doesNotMatch(helper, /fetch\(|L\.map|tileLayer|routing/);
  assert.match(fixture, /Editorial path fixture[\s\S]*?precision: "approximate"[\s\S]*?editorialPath=\{\{[\s\S]*?showFullscreenControl=\{true\}/);
  for (const language of [ne, nb]) {
    assert.match(language, /viewMapFullscreen:/);
    assert.match(language, /exitMapFullscreen:/);
  }
});

test("map-level OSM target uses exact pin or current map view without marker or query", () => {
  const center = { lat: 59.9, lng: 10.7 };
  const exact = { lat: 59.9123, lng: 10.7523, precision: "exact" };
  const approximate = { ...exact, precision: "approximate" };
  const exactUrl = openStreetMapViewUrl(center, 15, [exact], false);
  const multiUrl = openStreetMapViewUrl(center, 12, [exact, approximate], false);
  const pathUrl = openStreetMapViewUrl(center, 12, [exact], true);
  const approximateUrl = openStreetMapViewUrl(center, 12, [approximate], false);
  assert.equal(exactUrl, "https://www.openstreetmap.org/#map=15/59.91230/10.75230");
  assert.equal(openStreetMapViewUrl({ lat: 60, lng: 11 }, 15, [exact], false), exactUrl);
  assert.equal(multiUrl, "https://www.openstreetmap.org/#map=12/59.90000/10.70000");
  assert.equal(pathUrl, multiUrl);
  assert.equal(approximateUrl, multiUrl);
  assert.equal(openStreetMapViewUrl({lat: 0, lng: 181}, 5, [approximate], false), "https://www.openstreetmap.org/#map=5/0.00000/-179.00000");
  assert.notEqual(openStreetMapViewUrl({ lat: 60, lng: 11 }, 13, [exact, approximate], false), multiUrl);
  for (const url of [exactUrl, multiUrl, pathUrl, approximateUrl]) {
    assert.doesNotMatch(url, /\?|mlat|mlon|marker|query/i);
  }
  for (const [point, zoom] of [[{lat: NaN, lng: 0}, 5], [{lat: 91, lng: 0}, 5], [{lat: 0, lng: Infinity}, 5], [center, NaN], [center, 20], [center, -1]]) {
    assert.equal(openStreetMapViewUrl(point, zoom, [approximate], false), undefined);
  }
  assert.equal(openStreetMapViewUrl(center, 12, [], false), undefined);
  assert.equal(openStreetMapViewUrl(center, 12, [{ ...exact, lng: 181 }], false), undefined);
  assert.equal(openStreetMapViewUrl(center, 12, [{ ...exact, label: "<script>unsafe</script>" }], false).includes("unsafe"), false);
});

test("map-level navigation link is absent while map controls remain", async () => {
  const renderer = await read("../../src/components/content/LocationMap.astro");
  assert.doesNotMatch(renderer, /data-map-osm-link|openStreetMapViewUrl/);
  assert.match(renderer, /tiles\.once\("load", \(\) => \{/);
  assert.match(renderer, /data-map-zoom-in/);
});

test("list stays visible before load and on failure; only successful opted-out maps collapse it", () => {
  const hidden = { dataset: { showLocationList: "false" } };
  const visible = { dataset: { showLocationList: "true" } };
  assert.equal(hidden.dataset.mapListCollapsed, undefined);
  setMapListLoaded(hidden, true);
  assert.equal(hidden.dataset.mapListCollapsed, "true");
  setMapListLoaded(visible, true);
  assert.equal(visible.dataset.mapListCollapsed, undefined);
  setMapListLoaded(hidden, false);
  assert.equal(hidden.dataset.mapListCollapsed, undefined);
});

test("automatic maps load independently only on intersection; click mode is not observed", async () => {
  const automatic = { dataset: { loadingBehavior: "automatic" } };
  const other = { dataset: { loadingBehavior: "automatic" } };
  const click = { dataset: { loadingBehavior: "click" } };
  const observed = new Set();
  const loaded = [];
  let callback;
  let options;
  let disconnected = false;
  class Observer {
    constructor(cb, opts) {
      callback = cb;
      options = opts;
    }
    observe(root) {
      observed.add(root);
    }
    unobserve(root) {
      observed.delete(root);
    }
    disconnect() {
      disconnected = true;
    }
  }
  const cleanup = observeAutomaticMaps(
    [automatic, other, click],
    async (root) => loaded.push(root),
    Observer,
  );
  assert.equal(options.rootMargin, MAP_LAZY_ROOT_MARGIN);
  assert.equal(MAP_LAZY_ROOT_MARGIN, "300px 0px");
  assert.deepEqual([...observed], [automatic, other]);
  callback([{ target: other, isIntersecting: false }]);
  assert.deepEqual(loaded, []);
  callback([{ target: automatic, isIntersecting: true }]);
  assert.deepEqual(loaded, [automatic]);
  assert.deepEqual([...observed], [other]);
  callback([{ target: other, isIntersecting: true }]);
  assert.deepEqual(loaded, [automatic, other]);
  cleanup();
  assert.equal(disconnected, true);
});

test("simultaneous load and focus requests share activation, failures permit retry", async () => {
  const root = {};
  let calls = 0;
  let release;
  const ensure = createMapActivator(async () => {
    calls++;
    await new Promise((resolve) => {
      release = resolve;
    });
  });
  const first = ensure(root);
  const second = ensure(root);
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);
  release();
  await first;
  const third = ensure(root);
  await Promise.resolve();
  assert.equal(calls, 2);
  release();
  await third;
  let attempts = 0;
  const retry = createMapActivator(async () => {
    if (++attempts === 1) throw new Error("failed");
  });
  await assert.rejects(retry(root));
  await retry(root);
  assert.equal(attempts, 2);
});

test("without IntersectionObserver automatic maps stay reader-triggered", () => {
  const automatic = { dataset: { loadingBehavior: "automatic" } };
  let calls = 0;
  const cleanup = observeAutomaticMaps([automatic], async () => {
    calls++;
  });
  assert.equal(calls, 0);
  cleanup();
});

test("renderer keeps text and privacy notice, defers tiles, and supports focus and failure", async () => {
  const renderer = await read("../../src/components/content/LocationMap.astro");
  const server = renderer.slice(0, renderer.indexOf("<script>"));
  const script = renderer.slice(
    renderer.indexOf("<script>"),
    renderer.indexOf("</script>"),
  );
  assert.match(server, /labels\.externalNotice/);
  assert.match(server, /place\.label/);
  assert.match(server, /place\.description/);
  assert.match(server, /data-show-location-list=\{String\(display\.showLocationList\)\}/);
  assert.match(server, /class="location-map__place-details"/);
  assert.doesNotMatch(server, /data-map-list-collapsed/);
  assert.match(server, /display\.showViewOnMapActions && <button/);
  assert.doesNotMatch(server, /openStreetMapLocationUrl|labels\.openInOsm/);
  assert.match(server, /target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(server, /L\.tileLayer|<iframe|<img[^>]*tile/i);
  assert.match(script, /import\("leaflet"\)/);
  assert.match(script, /observeAutomaticMaps\(roots, ensureActive\)/);
  assert.match(script, /await ensureActive\(focusRoot\)/);
  assert.match(script, /layer\.openPopup\(\)/);
  assert.match(script, /bindPopup\(placeContent\(place, document\)\)/);
  assert.match(script, /tiles\.on\("tileerror"/);
  assert.match(script, /tiles\.once\("load", \(\) => \{\s*if \(activeMaps\.get\(id\) !== record\) return;\s*setMapListLoaded\(root, true\)/);
  assert.match(script, /const dispose = [\s\S]*?setMapListLoaded\(root, false\)/);
  assert.match(script, /keyboard: true,[\s\S]*?icon: createPlaceIcon/);
  assert.match(script, /marker\.getElement\(\)\?\.setAttribute\("aria-label", place\.label\)/);
  assert.match(script, /root\.dataset\.failedLabel/);
  assert.match(script, /referrerPolicy:/);
  assert.match(renderer, /data-map-list-collapsed="true"[\s\S]*?clip-path: inset\(50%\)/);
  assert.doesNotMatch(renderer, /aria-hidden=.*place-details|innerHTML|set:html/);
});

test("dev fixture includes automatic independent and explicit click maps", async () => {
  const fixture = await read("../../src/pages/dev/location-map-test.astro");
  assert.match(fixture, /if \(!import\.meta\.env\.DEV\)/);
  assert.equal((fixture.match(/loadingBehavior="automatic"/g) ?? []).length, 2);
  assert.match(fixture, /loadingBehavior="automatic"[\s\S]*?showLocationList=\{false\}/);
  assert.match(
    fixture,
    /loadingBehavior="click"[\s\S]*?showViewOnMapActions=\{true\}[\s\S]*?showOpenStreetMapLinks=\{true\}[\s\S]*?showLocationList=\{true\}/,
  );
});
