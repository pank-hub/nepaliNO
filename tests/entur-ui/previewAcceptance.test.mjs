// TEMPORARY (PR #112 hosted acceptance): remove with the Preview acceptance fixture before merge.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  MAX_REQUESTS,
  mountRateLimitProbe,
  runRateLimitProbe,
} from "../../src/lib/entur/previewAcceptance/rateLimitProbe";

const markup = `<section>
  <button data-probe="run">Run</button><button data-probe="recover" disabled>Recover</button>
  <p data-probe="summary"></p><ol data-probe="log"></ol><p data-probe="first-429"></p>
  <p data-probe="retry-after"></p><p data-probe="recovery-result"></p></section>`;

const ok = () =>
  new Response(JSON.stringify({ ok: true, suggestions: [{ label: "SECRET-COORDS", coordinates: { lat: 1, lng: 2 } }] }), {
    status: 200,
  });
const limited = (retryAfter = "37") =>
  new Response(JSON.stringify({ ok: false, code: "rate_limited", extra: "do-not-show" }), {
    status: 429,
    headers: retryAfter === null ? {} : { "retry-after": retryAfter },
  });

// Scripted fetch: each call takes the next response factory and records the request.
const scripted = (factories) => {
  const calls = [];
  const fetchImpl = async (input, init) => {
    calls.push({ input, init });
    const next = factories[Math.min(calls.length - 1, factories.length - 1)];
    return next();
  };
  return { fetchImpl, calls };
};

const setup = (fetchImpl) => {
  const dom = new JSDOM(markup);
  const ticks = { callback: undefined, cleared: false };
  const timers = {
    setInterval: (callback) => ((ticks.callback = callback), 1),
    clearInterval: () => (ticks.cleared = true),
  };
  const query = (name) => dom.window.document.querySelector(`[data-probe="${name}"]`);
  mountRateLimitProbe(dom.window.document, fetchImpl, timers);
  const click = async (name) => {
    query(name).dispatchEvent(new dom.window.Event("click"));
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  };
  return { dom, query, click, ticks };
};

test("nothing is sent until the button is clicked", async () => {
  const { fetchImpl, calls } = scripted([ok]);
  const { query } = setup(fetchImpl);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 0);
  assert.equal(query("run").disabled, false);
  assert.equal(query("recover").disabled, true);
});

test("a click sends requests to the real same-origin endpoint with the harmless query", async () => {
  const { fetchImpl, calls } = scripted([limited]);
  const { click } = setup(fetchImpl);
  await click("run");
  assert.equal(calls[0].input, "/api/entur/origins");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.deepEqual(JSON.parse(calls[0].init.body), { query: "Oslo S" });
});

test("never sends more than 21 requests", async () => {
  const { fetchImpl, calls } = scripted([ok]);
  const run = await runRateLimitProbe(fetchImpl);
  assert.equal(MAX_REQUESTS, 21);
  assert.equal(calls.length, 21);
  assert.equal(run.sent, 21);
  assert.equal(run.limited, undefined);
});

test("stops at the first 429 and records its status", async () => {
  const factories = [...Array(20).fill(ok), limited, ok];
  const { fetchImpl, calls } = scripted(factories);
  const run = await runRateLimitProbe(fetchImpl);
  assert.equal(calls.length, 21);
  assert.equal(run.sent, 21);
  assert.equal(run.statuses.at(-1), 429);

  const early = scripted([ok, ok, limited, ok]);
  const stopped = await runRateLimitProbe(early.fetchImpl);
  assert.equal(early.calls.length, 3);
  assert.deepEqual(stopped.statuses, [200, 200, 429]);
  assert.equal(stopped.limited.code, "rate_limited");
  assert.equal(stopped.limited.retryAfterSeconds, 37);
});

test("stops at an unexpected status without further requests", async () => {
  const { fetchImpl, calls } = scripted([ok, () => new Response("{}", { status: 503 }), ok]);
  const run = await runRateLimitProbe(fetchImpl);
  assert.equal(calls.length, 2);
  assert.deepEqual(run.statuses, [200, 503]);
});

test("displays the count, each status, the first 429 and Retry-After, and disables while running", async () => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  let count = 0;
  const fetchImpl = async () => {
    count += 1;
    if (count === 1) await gate;
    return count < 3 ? ok() : limited("37");
  };
  const { query, click } = setup(fetchImpl);
  const pending = click("run");
  assert.equal(query("run").disabled, true);
  assert.equal(query("recover").disabled, true);
  release();
  await pending;
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(query("summary").textContent, "Requests sent: 3 (maximum 21)");
  assert.deepEqual(
    [...query("log").children].map((item) => item.textContent),
    ["Request 1: HTTP 200", "Request 2: HTTP 200", "Request 3: HTTP 429"],
  );
  assert.match(query("first-429").textContent, /request 3: code rate_limited/);
  assert.match(query("retry-after").textContent, /Retry-After: 37 s/);
  assert.equal(query("run").disabled, true);
  assert.equal(query("recover").disabled, true);
});

test("recovery stays disabled until Retry-After elapses, then sends exactly one request", async () => {
  const { fetchImpl, calls } = scripted([limited.bind(null, "3"), ok]);
  const { query, click, ticks } = setup(fetchImpl);
  await click("run");
  assert.equal(calls.length, 1);
  assert.equal(query("recover").disabled, true);
  ticks.callback();
  ticks.callback();
  assert.equal(query("recover").disabled, true);
  await click("recover");
  assert.equal(calls.length, 1, "a disabled recovery button sends nothing");
  ticks.callback();
  assert.equal(ticks.cleared, true);
  assert.equal(query("recover").disabled, false);
  await click("recover");
  assert.equal(calls.length, 2);
  assert.equal(query("recovery-result").textContent, "Recovery request: HTTP 200; returned 200: yes");
  assert.equal(query("recover").disabled, true);
  await click("recover");
  assert.equal(calls.length, 2, "recovery sends exactly one request");
});

test("a missing Retry-After falls back to 60 seconds and shows that", async () => {
  const { fetchImpl } = scripted([() => limited(null)]);
  const { query, click } = setup(fetchImpl);
  await click("run");
  assert.match(query("retry-after").textContent, /missing \(assuming 60\) s; recovery available in 60 s/);
});

test("response bodies, coordinates and headers are never rendered", async () => {
  const { fetchImpl } = scripted([ok, limited]);
  const { dom, click } = setup(fetchImpl);
  await click("run");
  const text = dom.window.document.body.textContent;
  assert.doesNotMatch(text, /SECRET-COORDS|do-not-show|suggestions|lat|lng|content-type|cache-control/i);
});

const page = await readFile(new URL("../../src/pages/dev/entur-acceptance.astro", import.meta.url), "utf8");
const probe = await readFile(
  new URL("../../src/lib/entur/previewAcceptance/rateLimitProbe.ts", import.meta.url),
  "utf8",
);

test("the page is Preview-only and gated before any markup", () => {
  const guard = page.indexOf("if (import.meta.env.VERCEL_ENV !== 'preview') return new Response(null, {status: 404})");
  assert.ok(guard > 0);
  assert.ok(guard < page.indexOf("<BaseLayout"));
  assert.match(page, /prerender = false/);
  assert.match(page, /noIndex/);
  assert.match(page, /TEMPORARY/);
});

test("the fixture contains no secrets, mocks or Sanity access and starts nothing automatically", () => {
  for (const source of [page, probe]) {
    assert.doesNotMatch(source, /process\.env|SANITY|TOKEN|SECRET|UPSTASH|sanity\/client/i);
    assert.doesNotMatch(source, /window\.fetch\s*=|console\./);
  }
  assert.equal([...page.matchAll(/import\.meta\.env\.(\w+)/g)].every(([, name]) => name === "VERCEL_ENV"), true);
  assert.doesNotMatch(page, /mountRateLimitProbe\([^)]*\)\s*\.\s*click|\.click\(\)/);
  assert.match(page, /data-probe="recover" disabled/);
  assert.match(page, /Run controlled origin rate-limit test/);
  assert.match(page, /Test recovery/);
});
