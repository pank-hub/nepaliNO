# Entur travel assistance: Phase 1

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

**Release safeguard:** both endpoints return a generic no-store 404 before
reading input or contacting Sanity or Entur unless the server process has
`ENTUR_TRAVEL_API_ENABLED` set to the exact string `true`. It is not a
`PUBLIC_*` variable and defaults to disabled. Do not enable it in production
until distributed protection, privacy review and provider-terms review have
been approved and verified. For local tests only, set it in the server process
environment; the automated tests set and restore it explicitly.

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
No component, geolocation, translations or reader consent flow is implemented.
Do not deploy the endpoints until distributed protection and its response
contract are verified. Before launch, also review Entur attribution/terms,
privacy disclosure, event dates and accessible presentation.
