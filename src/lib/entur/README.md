# Entur travel assistance

The server-only client uses Entur's
[Geocoder v3 autocomplete](https://developer.entur.no/docs/open-services/geocoder)
and [Journey Planner v3 GraphQL](https://developer.entur.no/docs/open-services/journey-planner).
Every request identifies this application with `ET-Client-Name:
nepali-no-travel-assistance`. The client owns the endpoint URLs and the single
GraphQL operation. Alternatives are capped at three and suggestions at eight.
The operation requests walking for access, egress and direct journeys, plus
Entur's default public-transport modes.

`POST /api/entur/origins` accepts `{query}` (2–100 characters after Unicode
normalization and whitespace trimming). It returns `{ok: true, suggestions}`
with label, `{lat, lng}`, and optional ID, locality and category.

`POST /api/entur/journeys` accepts `{origin: {lat, lng}, destination: {type,
id}, dateTime, mode}`. The only allowed types are `communityEvent` and
`directoryListing`; IDs are 1–128 ASCII letters, digits, hyphens or underscores,
starting with a letter or digit. The server resolves coordinates with fixed
queries against the public `production` dataset using the published perspective,
without CDN or token. It requires a public route in an enabled language section,
an eligible physical event/listing, an active published listing or scheduled/
rescheduled event, and exact valid map coordinates without a stored radius.
Missing and ineligible documents return the same `destination_unavailable` code.
The published document must have `travelHelpEnabled === true`; false, missing,
null and malformed values are rejected. The Event and Directory Studio fields
default to false for new documents, and their validation requires a physical
location with an exact pin and no radius. Editors must independently verify that
the coordinates are safe to publish. News remains unsupported.

`dateTime` must be an ISO datetime
with seconds and timezone, from five minutes in the past through 90 days ahead.
`mode` is `departAfter` or `arriveBy`. It returns `{ok: true, journeys}` with
normalized times, seconds, transfers, optional walking seconds and ordered legs.
Transfers are an estimate: public-transport ride legs minus one, not a
provider-supplied count. In-seat changes and other special cases may differ.
Public transport is inferred from Entur's ride flag and transport mode; bicycle,
foot, car, scooter and carpool are not counted. Unknown modes are rejected.
Leg names can be absent, particularly for coordinate-based endpoints. `realtime`
is Entur's leg-level boolean indicating whether real-time data is available;
false does not prove that a service has no disruptions. No accessibility claim
is inferred. Durations are seconds; if Entur omits the nullable trip duration,
it is derived from the two expected timestamps. Walking time is only returned
when supplied by Entur.

Datetimes require an explicit offset or `Z`, and are compared as absolute
instants against the inclusive bounds (90 elapsed days, not calendar days).
Callers must resolve local time and DST ambiguity before submitting; the server
does not interpret a local time zone or adjust the requested instant.

Errors are `{ok: false, code}`: `method_not_allowed`,
`unsupported_media_type`, `request_too_large`, `invalid_request`, `timeout`,
`upstream_unavailable` (network/HTTP), `upstream_invalid_response`,
`upstream_graphql_error`, `rate_limited`, `no_journeys`,
`destination_unavailable`, or `destination_service_unavailable`. Upstream details
are never returned. All responses are
`private, no-store`; no shared cache should retain personal journey results.
The application does not persist or log inputs, but Geocoder receives the
search text and Entur receives journey coordinates and time. Entur documents
processing search metadata; infrastructure access logs and upstream retention
are outside this module's control. Review disclosure and logging configuration
before enabling the UI. OpenStreetMap rendering and requests remain independent.

**Release safeguard:** all three endpoints return a generic no-store 404 before
reading input, contacting Redis, Sanity or Entur unless the server process has
`ENTUR_TRAVEL_API_ENABLED` set to the exact string `true`. It is not a
`PUBLIC_*` variable and defaults to disabled. Even when it is `true`, the
endpoints fail closed (503) unless the distributed rate limiter is fully
configured (see below). Do not enable it in production until privacy review and
provider-terms review have been approved and the hosted verification has
passed. For local tests only, set it in the server process environment; the
automated tests set and restore it explicitly.

`POST /api/entur/availability` accepts only `{type, id}` with the same selector
validation as journeys. When enabled it independently checks the published
destination and returns only `{ok: true}` if eligible; errors are no-store.
When disabled it returns the generic 404 before reading the body or contacting
Sanity. The prerendered page uses the shared eligibility rules, and the hydrated
component remains invisible until this runtime check succeeds. It makes no
origin or journey request before the visitor searches. A previously open form
may remain visible until refresh after a flag change, but the routes fail closed.
Newly eligible static pages require their normal rebuild. All three endpoints,
including availability (which can query Sanity), are protected by the
distributed limiter described below.

The interface uses a deliberately submitted origin query and a selected result,
then sends `{origin, destination: {type, id}, dateTime, mode: "departAfter"}`.
The date input is Norway time; nonexistent and ambiguous Oslo DST times are
rejected rather than silently shifted. The same five-minute tolerance and
90-day elapsed horizon used by the server apply. The UI shows estimated
transfers and only labels real-time data when the normalized leg says so.
The browser never directly contacts Entur or supplies destination coordinates.
No browser geolocation or journey storage is used.

## Distributed rate limiting

**Why in the application.** Size limits, timeouts and fixed operations bound a
single request but not request volume. Each travel request can spend Sanity or
Entur quota and a serverless invocation, so accidental loops and obvious abuse
need a shared counter. An in-process limiter is not distributed protection and
is not used. The Vercel WAF submission rule (below) cannot cover these routes
without changing it, and Hobby permits only one rate-limit rule, so the limit
is enforced in the application against a provider-isolated store.

**Architecture.** Routes call a provider-neutral limiter
(`src/lib/rateLimit/server/limiter.ts`) that returns `allowed`, `limited`
(with retry-after seconds) or `unavailable`. Only
`src/lib/rateLimit/server/upstash.ts` knows Upstash; it uses `@upstash/redis`
(REST, serverless-compatible) and `@upstash/ratelimit` with a sliding window
against an Upstash Redis Pay as You Go database. Limits and categories live in
`src/lib/rateLimit/server/config.ts`. Every module is server-only and must not
be imported by components, islands or `PUBLIC_*` variables; a test enforces it.

| Category | Endpoint | Limit |
| --- | --- | --- |
| `entur-origin` | `/api/entur/origins` | 20 requests / 60 s |
| `entur-journey` | `/api/entur/journeys` | 10 requests / 60 s |
| `entur-availability` | `/api/entur/availability` | 30 requests / 60 s |

Availability runs once per page view that offers travel help, so it has the
highest limit. Each category is counted independently.

**Environment variables** (server-only, names only; never commit values, never
prefix with `PUBLIC_`, never log): `UPSTASH_REDIS_REST_URL` (must be `https`),
`UPSTASH_REDIS_REST_TOKEN` and `RATE_LIMIT_HASH_SECRET` (a long random value
generated for this purpose; rotating it resets everyone's counters).

**Request order.** For every endpoint: (1) feature flag; (2) method,
content-type and declared body-size checks, which need no provider; (3)
distributed rate-limit decision; (4) body reading, JSON parsing and validation;
(5) Sanity or Entur. A rejected or limited request never reaches step 4 or 5.
Invalid bodies that pass step 2 still count against the limit.

**Pseudonymous identifier.** The client address is read only from
`X-Forwarded-For`. Trust boundary: Vercel overwrites that header with the
connecting client address and does not forward client-supplied values, and the
Astro Vercel adapter derives `clientAddress` from the same header. A list, port,
bracket, zone identifier or non-address is treated as untrusted and fails
closed, as does an absent header (local development and Codespaces). IPv4 is
used whole, IPv4-mapped IPv6 collapses to IPv4, and other IPv6 addresses are
reduced to their /64 prefix. The Redis identifier is only
`HMAC-SHA-256(RATE_LIMIT_HASH_SECRET, normalizedAddress + "\n" + category)` as
hex, under the key prefix `nepali-no:ratelimit:<category>`. Raw addresses,
search text, coordinates, datetimes, routes, destination IDs, user agents and
request bodies are never sent to Redis or logged. Redis keys expire after the
window. Shared addresses (offices, mobile carriers) share one allowance.

**Fail-closed behavior.**

| Condition | Response |
| --- | --- |
| Flag absent or not `true` | 404 `not_found`; no Redis, Sanity or Entur call |
| Flag `true`, Redis URL, token or hash secret missing | 503 `temporarily_unavailable` |
| Client address missing or malformed | 503 `temporarily_unavailable` |
| Upstash error or no answer within 2 s | 503 `temporarily_unavailable` |
| Limit exceeded | 429 `rate_limited` with `Retry-After` (1–60 s, from the window reset) |

All responses are `private, no-store`. The Upstash SDK's own timeout would
resolve as *allowed*, so it is disabled and the application enforces the 2 s
timeout; retries are disabled. The only log line is
`[rate-limit] unavailable {category, reason}`. The browser maps 429 to its
existing rate-limited message and other failures to the generic failure message.

**No analytics.** `@upstash/ratelimit` analytics and SDK telemetry are off, so
no analytics keys or extra metadata are written. The SDK keeps a small
in-memory cache of already-blocked identifiers per warm instance; it only skips
Redis calls after Redis has already rejected the identifier.

**Cost and monitoring.** The database runs on Upstash Pay as You Go with a
maximum budget of $20 (owner-stated operational fact; configured in the Upstash
console, not in this repository). Each limiter check that reaches Redis is one
script evaluation; blocked-cache hits and flag-disabled requests make none.
Watch the Upstash console's command count and usage/billing views after
activation and after any traffic spike, keep the budget cap and a billing alert
enabled, and treat an unexpected rise as a possible loop or abuse. Confirm how
Upstash counts script evaluations before relying on any command estimate.

**Vercel WAF.** The existing Vercel submission rate-limit rule for Event and
Directory submissions is separate and must not be changed. No Entur WAF rule is
required by this design and none is represented in the repository.

**Deployment and rollback.** Create the Upstash database and set the three
variables as server-only, Production-scoped variables in Vercel (leave Preview
unset until a hosted test is approved). Redeploy, then verify with the flag
still absent that all three routes return 404. Only then set
`ENTUR_TRAVEL_API_ENABLED=true` for the target environment and redeploy;
confirm a normal 200, exceed a limit to see 429 with `Retry-After`, and confirm
503 if a variable is removed in a preview. To roll back, unset the flag and
redeploy (routes return 404 and never contact Redis). To rotate credentials,
replace the variables and redeploy; the flag stays off while the limiter is
misconfigured because the routes return 503.

The resolver cannot independently detect private or sensitive locations, verify
real-world location accuracy, or establish Norway coverage; editor confirmation
is essential.
The backend foundation and shared Event/Directory interface are implemented.
The automated Entur and rate-limit test suites pass (`npm run test:entur`,
`npm run test:entur-ui`, `npm run test:rate-limit`), and the mocked fixture's
origin-selection and journey-results flow has been manually verified. No live
Upstash, no live production Entur journey, and no hosted verification has been
performed. Keyboard, mobile, screen-reader and DST acceptance checks remain.

Do not enable the routes until the hosted limiter verification passes. Privacy
review, Entur provider-terms and attribution review, and
localized Privacy-page disclosure remain required before launch. The initial
English, Norwegian and Nepali interface wording is present; editorial
translation polishing and News integration remain future work. Browser
geolocation is not implemented.

## Local checks and rollback

Start the local development server with `ENTUR_TRAVEL_API_ENABLED=true` in its
server environment and open `/dev/travel-help-test/`. The page overrides fetch
for its three travel endpoints with mock responses only; its scenario links
cover eligible and ineligible content, results and failure states. It returns
404 outside development and `/dev` is excluded from the sitemap. The normal
public pages, if enabled locally, use live Entur and published Sanity data:
do not enter personal data during testing. Run `npm run test:entur` and
`npm run test:entur-ui` and `npm run test:rate-limit` (mocked Redis; no network).
Browser keyboard, mobile, screen-reader and DST
acceptance testing is still required.

To roll back, unset the server flag or set it to a value other than `true`, then
restart/redeploy the server. Confirm generic private no-store 404s from all
three endpoints and reload open pages; do not change the submission firewall rule.

## Attribution and official sources

`TravelHelp` shows a localized, visually secondary attribution below the
results and notice (`.travel-help__attribution`, strings `attribution`,
`attributionEntur`, `attributionNlod` and `attributionOsm` in
`src/i18n/travelHelp.ts`). The sentence holds `{entur}`, `{nlod}` and `{osm}`
tokens that the component replaces with links opening in a new tab with
`rel="noopener noreferrer"`: Entur AS (https://entur.no), the Norwegian
Licence for Open Government Data (https://data.norge.no/nlod/en/2.0) and
OpenStreetMap contributors (https://www.openstreetmap.org/copyright). It states
that the travel information is arranged by nepali.no, names Entur only as the
data source and does not imply endorsement. Official stop and line names come
from Entur and are never rewritten. Entur's geocoder combines the national
stop registry, the cadastre, Kartverket place names and OpenStreetMap, so the
text also credits OpenStreetMap contributors for place data. Map tiles are
attributed by Leaflet's in-map control (`MAP_PROVIDER.attribution`).

The privacy line in the component and the "Maps and travel assistance"
fallback section in `src/pages/[lang]/privacy.astro` describe the same facts:
Entur receives requests from nepali.no's server, not the reader's browser;
nothing about the reader's starting place or journeys is stored; Upstash
receives only a short-lived pseudonymous HMAC identifier; operational logs may
still exist. The published Privacy page comes from Sanity `trustPage` documents
(the fallback applies only when none is published), so the same section must
also be added there. Browser geolocation is not implemented.

Official sources (reviewed November 2026):

- Entur Terms of Service (API terms, NLOD attribution, privacy and 14-month
  request-log retention): https://developer.entur.no/terms-of-service
- Entur Privacy Policy: https://om.entur.no/personvern/
- Entur Geocoder data sources: https://developer.entur.no/docs/open-services/geocoder
- Norwegian Licence for Open Government Data (NLOD) 2.0:
  https://data.norge.no/nlod/en/2.0
- OpenStreetMap Foundation Tile Usage Policy:
  https://operations.osmfoundation.org/policies/tiles/
- OpenStreetMap Attribution Guidelines:
  https://osmfoundation.org/wiki/Licence/Attribution_Guidelines

## Privacy-page draft — editorial and legal review required, not published

The drafts below pre-date the implemented fallback section and are kept for
review history; the fallback in `privacy.astro` is the current code wording.

**English:** When you search for a public transport journey, nepali.no sends
the starting place you enter to Entur to find suggestions. When you select a
starting place and request a journey, nepali.no sends its coordinates, the
destination and the requested date and time to Entur. Our application does not
log the submitted travel search data. Infrastructure and providers, including
Vercel and Entur, may process your IP address and technical request metadata;
their retention practices are outside our control. Entur's own privacy and
usage terms apply. Maps shown on the page may also make requests to external
OpenStreetMap-related providers.

**Norsk:** Når du søker etter en kollektivreise, sender nepali.no startstedet
du skriver inn til Entur for å finne forslag. Når du velger et startsted og
søker etter en reise, sender nepali.no koordinatene, reisemålet og ønsket dato
og klokkeslett til Entur. Applikasjonen vår logger ikke reisesøket du sender inn.
Infrastruktur og leverandører, blant annet Vercel og Entur, kan behandle
IP-adressen din og tekniske forespørselsdata; vi styrer ikke deres lagringstid.
Enturs egne personvern- og bruksvilkår gjelder. Kart på siden kan også sende
forespørsler til eksterne OpenStreetMap-relaterte leverandører.

**नेपाली:** सार्वजनिक यातायातको यात्रा खोज्दा तपाईंले लेखेको प्रस्थान स्थान
सुझाव खोज्न nepali.no ले Entur लाई पठाउँछ। प्रस्थान स्थान छानेर यात्रा खोज्दा
त्यसको निर्देशाङ्क, गन्तव्य र चाहिएको मिति तथा समय Entur लाई पठाइन्छ। हाम्रो
एप्लिकेसनले तपाईंले पठाएको यात्रा खोजीको विवरण लग गर्दैन। Vercel र Entur
लगायत पूर्वाधार तथा सेवा प्रदायकले तपाईंको IP ठेगाना र प्राविधिक अनुरोध
विवरण प्रशोधन गर्न सक्छन्; तिनको भण्डारण अवधि हाम्रो नियन्त्रणमा छैन।
Entur का आफ्नै गोपनीयता र प्रयोगसम्बन्धी सर्त लागू हुन्छन्। पृष्ठमा देखिने
नक्साले बाह्य OpenStreetMap सम्बन्धित प्रदायकलाई पनि अनुरोध पठाउन सक्छ।
