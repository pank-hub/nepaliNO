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
reading input or contacting Sanity or Entur unless the server process has
`ENTUR_TRAVEL_API_ENABLED` set to the exact string `true`. It is not a
`PUBLIC_*` variable and defaults to disabled. Do not enable it in production
until distributed protection, privacy review and provider-terms review have
been approved and verified. For local tests only, set it in the server process
environment; the automated tests set and restore it explicitly.

`POST /api/entur/availability` accepts only `{type, id}` with the same selector
validation as journeys. When enabled it independently checks the published
destination and returns only `{ok: true}` if eligible; errors are no-store.
When disabled it returns the generic 404 before reading the body or contacting
Sanity. The prerendered page uses the shared eligibility rules, and the hydrated
component remains invisible until this runtime check succeeds. It makes no
origin or journey request before the visitor searches. A previously open form
may remain visible until refresh after a flag change, but the routes fail closed.
Newly eligible static pages require their normal rebuild. All three endpoints,
including availability (which can query Sanity), require approved distributed
protection before activation.

The interface uses a deliberately submitted origin query and a selected result,
then sends `{origin, destination: {type, id}, dateTime, mode: "departAfter"}`.
The date input is Norway time; nonexistent and ambiguous Oslo DST times are
rejected rather than silently shifted. The same five-minute tolerance and
90-day elapsed horizon used by the server apply. The UI shows estimated
transfers and only labels real-time data when the normalized leg says so.
The browser never directly contacts Entur or supplies destination coordinates.
No browser geolocation or journey storage is used.

The current size limits, timeout and fixed operations do not provide distributed
rate limiting. No paid service or in-process rate limiter is included. The
owner reports that Vercel Hobby's single rate-limit rule already protects Event
and Directory submissions: preserve that rule unchanged. Suitable separate
protection must be approved before activation. A possible future design is
two independent IP-keyed Vercel WAF rules for paths `/api/entur/origins` and
`/api/entur/journeys` (including trailing-slash variants): initial proposed
limits are 20 requests per 10 seconds and 120 per 600 seconds, each with a
429 action. These are starting values requiring owner approval and traffic
testing, not established provider quotas. Vercel's counters are regional,
not globally strict, and fixed windows can permit bursts across window edges.
Verify both rules actually apply, return sanitized 429 responses and a bounded
`Retry-After`, including across regions; the WAF default response/header
contract has not been verified. Pro supports two rate rules, whereas Hobby
currently permits only one. Consult Vercel's regional pricing and assess
shared-IP false positives before enabling. IP addresses are used by Vercel
for counting and may appear in firewall logs; review access and retention.
Never use journey data as a key.

The resolver cannot independently detect private or sensitive locations, verify
real-world location accuracy, or establish Norway coverage; editor confirmation
is essential.
The backend foundation and shared Event/Directory interface are implemented.
The automated Entur test suites pass, and the mocked fixture's origin-selection
and journey-results flow has been manually verified. No live production Entur
journey has been tested. Keyboard, mobile, screen-reader and DST acceptance
checks remain.

Do not enable the routes until distributed protection and its response contract
are verified. Privacy review, Entur provider-terms and attribution review, and
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
`npm run test:entur-ui`. Browser keyboard, mobile, screen-reader and DST
acceptance testing is still required.

To roll back, unset the server flag or set it to a value other than `true`, then
restart/redeploy the server. Confirm generic private no-store 404s from all
three endpoints and reload open pages; do not change the submission firewall rule.

## Privacy-page draft — editorial and legal review required, not published

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
