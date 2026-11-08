import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import TravelHelp from "../../src/components/content/TravelHelp";
import { travelHelp } from "../../src/i18n/travelHelp";
import { osloLocalToInstant } from "../../src/lib/entur/osloTime";
import { eligibleDestinationCoordinates } from "../../src/lib/entur/eligibility";
import { createAvailabilityHandler } from "../../src/pages/api/entur/availability";

const selector = { type: "communityEvent", id: "event-1" };
const event = {
  _id: selector.id,
  _type: selector.type,
  language: "ne",
  slug: "test",
  eventFormat: "in-person",
  eventStatus: "scheduled",
  travelHelpEnabled: true,
  mapLocation: {
    precision: "exact",
    hasRadius: false,
    coordinates: { lat: 59.9, lng: 10.7 },
  },
};

test("map selector changes trigger a fresh availability check and ignore stale responses", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {url: "https://nepali.no/"});
  const old = {window: globalThis.window, document: globalThis.document, navigator: globalThis.navigator, fetch: globalThis.fetch};
  Object.defineProperty(globalThis, "window", {value: dom.window, configurable: true});
  Object.defineProperty(globalThis, "document", {value: dom.window.document, configurable: true});
  Object.defineProperty(globalThis, "navigator", {value: dom.window.navigator, configurable: true});
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const calls = [];
  let resolveFirst;
  globalThis.fetch = async (_url, init) => {
    calls.push(JSON.parse(String(init.body)));
    if (calls.length === 1) return new Promise((resolve) => {resolveFirst = resolve});
    return Response.json({ok: true});
  };
  const {createRoot} = await import("react-dom/client");
  const element = dom.window.document.getElementById("root");
  const root = createRoot(element);
  const first = {type: "newsArticle", id: "article-1", mapKey: "map-1", placeKey: "place-1"};
  const second = {...first, mapKey: "map-2", placeKey: "place-2"};
  try {
    const render = (destination) => root.render(React.createElement(TravelHelp, {
      destination, language: "ne", labels: travelHelp.ne,
    }));
    await act(async () => {render(first)});
    await act(async () => {render(second)});
    assert.deepEqual(calls, [first, second]);
    assert.ok(element.querySelector("details"));
    await act(async () => {resolveFirst(Response.json({ok: false}, {status: 404}))});
    assert.ok(element.querySelector("details"));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, value] of Object.entries(old)) {
      Object.defineProperty(globalThis, key, {value, configurable: true, writable: true});
    }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});

test("eligibility uses the same strict public rules for page and resolver", () => {
  assert.deepEqual(eligibleDestinationCoordinates(selector, event), {
    lat: 59.9,
    lng: 10.7,
  });
  for (const value of [false, undefined, "true", null]) {
    assert.equal(
      eligibleDestinationCoordinates(selector, {
        ...event,
        travelHelpEnabled: value,
      }),
      undefined,
    );
  }
  for (const location of [
    { ...event.mapLocation, precision: "approximate" },
    { ...event.mapLocation, hasRadius: true },
    { ...event.mapLocation, precision: undefined },
  ])
    assert.equal(
      eligibleDestinationCoordinates(selector, {
        ...event,
        mapLocation: location,
      }),
      undefined,
    );
  assert.equal(
    eligibleDestinationCoordinates(selector, {
      ...event,
      eventFormat: "online",
    }),
    undefined,
  );
  assert.equal(
    eligibleDestinationCoordinates(selector, {
      ...event,
      eventStatus: "cancelled",
    }),
    undefined,
  );
  assert.equal(
    eligibleDestinationCoordinates(selector, { ...event, language: "nb" }),
    undefined,
  );
});

test("Oslo local time rejects nonexistent and ambiguous times, bad dates and server horizon violations", () => {
  const now = Date.parse("2026-03-01T00:00:00Z");
  assert.equal(osloLocalToInstant("2026-03-29T02:30", now), undefined);
  assert.equal(
    osloLocalToInstant("2026-03-29T03:30", now),
    "2026-03-29T01:30:00.000Z",
  );
  assert.equal(
    osloLocalToInstant("2026-03-29T01:30", now),
    "2026-03-29T00:30:00.000Z",
  );
  assert.equal(
    osloLocalToInstant("2026-10-25T02:30", Date.parse("2026-10-01T00:00:00Z")),
    undefined,
  );
  assert.equal(osloLocalToInstant("2026-02-30T12:00", now), undefined);
  assert.equal(osloLocalToInstant("2026-03-01T12:00+01:00", now), undefined);
  assert.equal(osloLocalToInstant("2026-07-01T12:00", now), undefined);
  assert.equal(osloLocalToInstant("2026-02-27T12:00", now), undefined);
});

test("availability fails closed before destination resolution and returns no-store", async () => {
  const prior = process.env.ENTUR_TRAVEL_API_ENABLED;
  delete process.env.ENTUR_TRAVEL_API_ENABLED;
  let called = false;
  try {
    const handler = createAvailabilityHandler(async () => {
      called = true;
      return { lat: 1, lng: 1 };
    });
    const response = await handler({
      request: new Request("https://nepali.no/api/entur/availability", {
        method: "POST",
      }),
    });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), { ok: false, code: "not_found" });
    assert.equal(called, false);
  } finally {
    if (prior === undefined) delete process.env.ENTUR_TRAVEL_API_ENABLED;
    else process.env.ENTUR_TRAVEL_API_ENABLED = prior;
  }
});

test("development fixture is gated and sitemap excludes dev", async () => {
  const fixture = await readFile(
    new URL("../../src/pages/dev/travel-help-test.astro", import.meta.url),
    "utf8",
  );
  assert.match(fixture, /components\/content\/TravelHelp\.astro/);
  assert.match(fixture, /!import\.meta\.env\.DEV/);
  const { isSitemapPage } = await import("../../src/config/sitemapFilter.mjs");
  assert.equal(isSitemapPage("https://nepali.no/dev/travel-help-test/"), false);
});

test("TravelHelp stylesheet is global to the rendered React island and covers its structural classes", async () => {
  const astro = await readFile(
    new URL("../../src/components/content/TravelHelp.astro", import.meta.url),
    "utf8",
  );
  const component = await readFile(
    new URL("../../src/components/content/TravelHelp.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../../src/components/content/travelHelp.css", import.meta.url),
    "utf8",
  );
  assert.match(astro, /import ['"]\.\/travelHelp\.css['"]/);
  assert.match(astro, /<TravelHelp[\s\S]*client:load/)
  for (const name of [
    "travel-help",
    "travel-help__suggestion",
    "travel-help__journey",
    "travel-help__leg",
  ]) {
    assert.ok(component.includes(name), `component uses ${name}`);
    assert.ok(css.includes(`.${name}`), `stylesheet defines ${name}`);
  }
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test("interactive workflow uses only server selectors and deliberate searches", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: "https://nepali.no/",
  });
  const old = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
    fetch: globalThis.fetch,
  };
  Object.defineProperty(globalThis, "window", {
    value: dom.window,
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: dom.window.document,
    configurable: true,
  });
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const calls = [];
  let scenario = "success";
  let resolveOldSearch;
  let oldSignal;
  globalThis.fetch = async (input, init) => {
    const path = String(input);
    calls.push({ path, body: JSON.parse(String(init?.body)) });
    if (path.endsWith("/availability"))
      return scenario === "disabled"
        ? Response.json({ ok: false, code: "not_found" }, { status: 404 })
        : Response.json({ ok: true });
    if (path.endsWith("/origins")) {
      if (scenario === "stale") {
        oldSignal = init.signal;
        return new Promise((resolve) => {
          resolveOldSearch = resolve;
        });
      }
      return Response.json({
        ok: true,
        suggestions: [
          {
            label: "Oslo S",
            locality: "Oslo",
            coordinates: { lat: 59.9, lng: 10.7 },
          },
        ],
      });
    }
    if (
      scenario === "no_journeys" ||
      scenario === "timeout" ||
      scenario === "rate_limited"
    ) {
      return Response.json(
        { ok: false, code: scenario },
        { status: scenario === "rate_limited" ? 429 : 404 },
      );
    }
    if (scenario === "malformed")
      return Response.json({ ok: true, journeys: "bad" });
    return Response.json({
      ok: true,
      journeys: [
        {
          startTime: "2026-11-07T12:00:00Z",
          endTime: "2026-11-07T12:30:00Z",
          durationSeconds: 1800,
          transfers: 0,
          legs: [
            {
              startTime: "2026-11-07T12:00:00Z",
              endTime: "2026-11-07T12:30:00Z",
              durationSeconds: 1800,
              mode: "bus",
              isPublicTransport: true,
              realtime: true,
              fromName: "Oslo S",
              toName: "Stop",
              lineName: "30",
            },
          ],
        },
      ],
    });
  };
  const rootElement = dom.window.document.getElementById("root");
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(rootElement);
  try {
    await act(async () => {
      root.render(
        React.createElement(TravelHelp, {
          destination: selector,
          language: "ne",
          labels: travelHelp.ne,
        }),
      );
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, "/api/entur/availability");
    assert.ok(rootElement.querySelector("details:not([open])"));
    assert.ok(rootElement.querySelector('[aria-live="polite"]'));
    const input = rootElement.querySelector("input:not([type])");
    assert.equal(
      rootElement.querySelector(`label[for="${input.id}"]`).textContent,
      travelHelp.ne.origin,
    );
    assert.equal(
      rootElement.querySelectorAll('form[aria-busy="false"]').length,
      2,
    );
    assert.equal(
      rootElement.querySelector(".travel-help__primary-button").disabled,
      true,
    );
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        dom.window.HTMLInputElement.prototype,
        "value",
      ).set.call(input, "Oslo");
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    assert.equal(calls.length, 1);
    await act(async () => {
      rootElement
        .querySelector("form")
        .dispatchEvent(
          new dom.window.Event("submit", { bubbles: true, cancelable: true }),
        );
    });
    assert.equal(calls[1].path, "/api/entur/origins");
    const option = rootElement.querySelector("input[type=radio]");
    assert.ok(option.closest("label"));
    assert.equal(option.name.length > 0, true);
    assert.equal(
      new Set(
        [
          ...rootElement.querySelectorAll(
            'input[type=radio][name$="-suggestion"]',
          ),
        ].map((radio) => radio.name),
      ).size,
      1,
      "suggestion radios share a native keyboard-operable group",
    );
    await act(async () => {
      option.click();
    });
    assert.equal(option.checked, true);
    assert.match(
      rootElement.textContent,
      new RegExp(travelHelp.ne.originSelected),
    );
    await act(async () => {
      rootElement
        .querySelectorAll("form")[1]
        .dispatchEvent(
          new dom.window.Event("submit", { bubbles: true, cancelable: true }),
        );
    });
    assert.equal(calls[2].path, "/api/entur/journeys");
    assert.deepEqual(calls[2].body.destination, selector);
    assert.deepEqual(Object.keys(calls[2].body).sort(), [
      "dateTime",
      "destination",
      "mode",
      "origin",
    ]);
    assert.match(rootElement.textContent, /Oslo S/);
    assert.match(rootElement.textContent, /30/);
    assert.ok(rootElement.querySelector("article[aria-labelledby]"));
    assert.ok(rootElement.querySelector("dl"));
    assert.ok(rootElement.querySelector(".travel-help__legs"));
    assert.equal(
      dom.window.document.activeElement,
      rootElement.querySelector("h3"),
    );
    for (const [mode, expected] of [
      ["no_journeys", travelHelp.ne.noJourneys],
      ["timeout", travelHelp.ne.timeout],
      ["rate_limited", travelHelp.ne.rateLimited],
      ["malformed", travelHelp.ne.failure],
    ]) {
      scenario = mode;
      await act(async () => {
        rootElement
          .querySelectorAll("form")[1]
          .dispatchEvent(
            new dom.window.Event("submit", { bubbles: true, cancelable: true }),
          );
      });
      assert.match(rootElement.textContent, new RegExp(expected));
    }
    const changeInput = async (value) =>
      act(async () => {
        Object.getOwnPropertyDescriptor(
          dom.window.HTMLInputElement.prototype,
          "value",
        ).set.call(input, value);
        input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
    await changeInput("x");
    const count = calls.length;
    await act(async () => {
      rootElement
        .querySelector("form")
        .dispatchEvent(
          new dom.window.Event("submit", { bubbles: true, cancelable: true }),
        );
    });
    assert.equal(calls.length, count);
    assert.match(
      rootElement.textContent,
      new RegExp(travelHelp.ne.invalidOrigin),
    );
    await changeInput("Bergen");
    scenario = "stale";
    await act(async () => {
      rootElement
        .querySelector("form")
        .dispatchEvent(
          new dom.window.Event("submit", { bubbles: true, cancelable: true }),
        );
    });
    await changeInput("Oslo");
    assert.equal(oldSignal.aborted, true);
    scenario = "success";
    await act(async () => {
      rootElement
        .querySelector("form")
        .dispatchEvent(
          new dom.window.Event("submit", { bubbles: true, cancelable: true }),
        );
    });
    await act(async () => {
      resolveOldSearch(
        Response.json({
          ok: true,
          suggestions: [{ label: "Stale", coordinates: { lat: 1, lng: 1 } }],
        }),
      );
    });
    assert.doesNotMatch(rootElement.textContent, /Stale/);
    assert.match(rootElement.textContent, /Oslo S/);
    scenario = "disabled";
    await act(async () => {
      root.render(
        React.createElement(TravelHelp, {
          key: "disabled",
          destination: selector,
          language: "ne",
          labels: travelHelp.ne,
        }),
      );
    });
    assert.equal(rootElement.querySelector("form"), null);
  } finally {
    await act(async () => root.unmount());
    globalThis.fetch = old.fetch;
    for (const key of ["window", "document", "navigator"]) {
      if (old[key] === undefined) delete globalThis[key];
      else
        Object.defineProperty(globalThis, key, {
          value: old[key],
          configurable: true,
        });
    }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    dom.window.close();
  }
});
