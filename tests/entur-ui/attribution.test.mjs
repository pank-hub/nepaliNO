import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import TravelHelp from "../../src/components/content/TravelHelp";
import { travelHelp } from "../../src/i18n/travelHelp";

const selector = { type: "communityEvent", id: "event-1" };
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const EXPECTED = {
  nb: "Inneholder data under Norsk lisens for offentlige data (NLOD) tilgjengeliggjort av Entur AS. Reiseinformasjonen er sammenstilt av nepali.no. Stedsdata kan inneholde © OpenStreetMap-bidragsytere.",
  ne: "यसमा Entur AS ले उपलब्ध गराएको Norsk lisens for offentlige data (NLOD) अन्तर्गतको डेटा समावेश छ। यात्रा जानकारी nepali.no ले व्यवस्थित गरेको हो। स्थान डेटामा © OpenStreetMap योगदानकर्ताहरू समावेश हुन सक्छन्।",
  en: "Contains data made available by Entur AS under the Norwegian Licence for Open Government Data (NLOD). Travel information is arranged by nepali.no. Place data may include © OpenStreetMap contributors.",
};
const renderAvailable = async (language) => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: "https://nepali.no/",
  });
  const saved = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
    fetch: globalThis.fetch,
  };
  for (const key of ["window", "document", "navigator"]) {
    Object.defineProperty(globalThis, key, {
      value: key === "window" ? dom.window : dom.window[key],
      configurable: true,
    });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const requests = [];
  globalThis.fetch = async (input) => {
    requests.push(String(input));
    return Response.json({ ok: true });
  };
  const rootElement = dom.window.document.getElementById("root");
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(rootElement);
  await act(async () => {
    root.render(
      React.createElement(TravelHelp, {
        destination: selector,
        language: language === "en" ? "ne" : language,
        labels: travelHelp[language],
      }),
    );
  });
  const restore = async () => {
    await act(async () => root.unmount());
    for (const [key, value] of Object.entries(saved)) {
      Object.defineProperty(globalThis, key, { value, configurable: true });
    }
  };
  return { rootElement, requests, restore };
};

for (const language of ["nb", "ne", "en"]) {
  test(`${language}: attribution text is exact and links open safely`, async () => {
    const { rootElement, requests, restore } = await renderAvailable(language);
    try {
      assert.deepEqual(requests, ["/api/entur/availability"]);
      const attribution = rootElement.querySelector("[data-travel-attribution]");
      assert.ok(attribution, "attribution renders with the travel component");
      assert.equal(attribution.textContent, EXPECTED[language]);
      const links = [...attribution.querySelectorAll("a")];
      assert.equal(links.length, 3);
      const byHref = Object.fromEntries(links.map((a) => [a.href, a]));
      assert.ok(byHref["https://entur.no/"]);
      assert.ok(byHref["https://data.norge.no/nlod/en/2.0"]);
      assert.ok(byHref["https://www.openstreetmap.org/copyright"]);
      for (const link of links) {
        assert.equal(link.target, "_blank");
        assert.match(link.rel, /\bnoopener\b/);
        assert.match(link.rel, /\bnoreferrer\b/);
      }
      assert.equal(byHref["https://entur.no/"].textContent, "Entur AS");
      assert.match(byHref["https://data.norge.no/nlod/en/2.0"].textContent, /NLOD/);
      assert.match(byHref["https://www.openstreetmap.org/copyright"].textContent, /OpenStreetMap/);
      const body = rootElement.querySelector(".travel-help__body");
      assert.equal(body.lastElementChild, attribution, "attribution is the last element, below results and notice");
      assert.doesNotMatch(attribution.textContent, /endorse|anbefal|समर्थन/i);
    } finally {
      await restore();
    }
  });
}

test("attribution stays hidden with the whole component while Entur is unavailable", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "https://nepali.no/" });
  const saved = { window: globalThis.window, document: globalThis.document, navigator: globalThis.navigator, fetch: globalThis.fetch };
  for (const key of ["window", "document", "navigator"]) {
    Object.defineProperty(globalThis, key, { value: key === "window" ? dom.window : dom.window[key], configurable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.fetch = async () => Response.json({ ok: false, code: "not_found" }, { status: 404 });
  const rootElement = dom.window.document.getElementById("root");
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(rootElement);
  try {
    await act(async () => {
      root.render(React.createElement(TravelHelp, { destination: selector, language: "nb", labels: travelHelp.nb }));
    });
    assert.equal(rootElement.querySelector("[data-travel-attribution]"), null);
    assert.equal(rootElement.textContent, "");
  } finally {
    await act(async () => root.unmount());
    for (const [key, value] of Object.entries(saved)) Object.defineProperty(globalThis, key, { value, configurable: true });
  }
});

test("attribution labels are present and consistent in every language", () => {
  for (const language of ["nb", "ne", "en"]) {
    const labels = travelHelp[language];
    for (const token of ["{entur}", "{nlod}", "{osm}"]) {
      assert.equal(labels.attribution.split(token).length, 2, `${language} ${token}`);
    }
    assert.match(labels.attribution, /nepali\.no/);
    assert.equal(labels.attributionEntur, "Entur AS");
  }
});

test("corrected travel privacy wording states the data flow without denying operational logs", () => {
  const required = {
    en: [/via nepali\.no to Entur/, /coordinates and requested time are sent to Entur/, /not directly from your browser/, /does not store your starting place or journey history/],
    nb: [/via nepali\.no til Entur/, /koordinater og ønsket tidspunkt sendes til Entur/, /ikke direkte fra nettleseren din/, /lagrer ikke startstedet ditt eller reisehistorikken din/],
    ne: [/nepali\.no मार्फत Entur मा पठाइन्छ/, /निर्देशांक र चाहिएको समय Entur मा पठाइन्छ/, /ब्राउजरबाट सीधै होइन/, /यात्रा इतिहास भण्डारण गर्दैन/],
  };
  for (const [language, patterns] of Object.entries(required)) {
    const text = travelHelp[language].privacy;
    for (const pattern of patterns) assert.match(text, pattern, language);
    assert.doesNotMatch(text, /no logs|ingen logg|लग छैन|never logged/i, language);
    assert.doesNotMatch(text, /technical request information are sent to nepali\.no and Entur/);
  }
});

test("attribution styling is secondary, readable and wraps on narrow screens", async () => {
  const css = await read("../../src/components/content/travelHelp.css");
  const rule = /\.travel-help__attribution\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  assert.match(rule, /overflow-wrap:\s*anywhere/);
  assert.match(rule, /color:\s*var\(--text-muted/);
  assert.match(rule, /line-height:\s*1\.5/);
  const size = /font-size:\s*([\d.]+)rem/.exec(rule);
  assert.ok(size && Number(size[1]) >= 0.8 && Number(size[1]) < 0.9, "smaller than the notice but still readable");
  assert.doesNotMatch(rule, /\b(width|inline-size|white-space:\s*nowrap)/);
  assert.match(css, /\.travel-help__attribution a:focus-visible/);
  const muted = /--text-muted:\s*(#[0-9a-f]{6})/i.exec(await read("../../src/styles/global.css"))?.[1];
  assert.ok(muted, "muted text colour token exists");
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = 1.05 / (luminance(muted) + 0.05);
  assert.ok(ratio >= 4.5, `contrast ${ratio.toFixed(2)} meets WCAG AA on white`);
});

test("no browser geolocation is implemented in map or travel code", async () => {
  const { readdir } = await import("node:fs/promises");
  const walk = async (directory) => {
    const found = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) found.push(...(await walk(path)));
      else if (/\.(ts|tsx|js|mjs|astro)$/.test(entry.name)) found.push(path);
    }
    return found;
  };
  const root = new URL("../../src", import.meta.url).pathname;
  for (const file of await walk(root)) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /navigator\.geolocation|getCurrentPosition|watchPosition/, file);
  }
});
