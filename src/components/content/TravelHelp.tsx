import React, { useEffect, useId, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { osloLocalToInstant } from "../../lib/entur/osloTime";
import {
  isDateTime,
  isRecord,
  parseCoordinates,
  parseOriginQuery,
} from "../../lib/entur/validation";
import type {
  Journey,
  JourneyRequest,
  OriginSuggestion,
} from "../../lib/entur/types";
import { getTravelHelpLabels, interpolate, type TravelHelpLabels } from "../../i18n/travelHelp";
import { formatJourneyTimes } from "../../lib/entur/journeyDisplay";

type Labels = TravelHelpLabels;
type Props = {
  destination: JourneyRequest["destination"];
  language: string;
  labels?: Partial<Labels>;
  defaultOpen?: boolean;
};
type ErrorKind = "failure" | "timeout" | "rateLimited" | "noJourneys";

const isSuggestion = (value: unknown): value is OriginSuggestion =>
  isRecord(value) &&
  typeof value.label === "string" &&
  value.label.length > 0 &&
  value.label.length <= 500 &&
  !!parseCoordinates(value.coordinates) &&
  (value.locality === undefined || typeof value.locality === "string");

function isJourney(value: unknown, labels: Labels): value is Journey {
  if (
    !isRecord(value) ||
    !isDateTime(value.startTime) ||
    !isDateTime(value.endTime) ||
    Date.parse(value.endTime) < Date.parse(value.startTime) ||
    typeof value.durationSeconds !== "number" ||
    !Number.isFinite(value.durationSeconds) ||
    value.durationSeconds < 0 ||
    typeof value.transfers !== "number" ||
    !Number.isInteger(value.transfers) ||
    value.transfers < 0 ||
    (value.walkingDurationSeconds !== undefined &&
      (typeof value.walkingDurationSeconds !== "number" ||
        !Number.isFinite(value.walkingDurationSeconds) ||
        value.walkingDurationSeconds < 0)) ||
    !Array.isArray(value.legs) ||
    value.legs.length < 1 ||
    value.legs.length > 40
  )
    return false;
  return value.legs.every(
    (leg: unknown) =>
      isRecord(leg) &&
      isDateTime(leg.startTime) &&
      isDateTime(leg.endTime) &&
      typeof leg.mode === "string" &&
      Object.hasOwn(labels.modes, leg.mode) &&
      Date.parse(leg.endTime) >= Date.parse(leg.startTime) &&
      typeof leg.durationSeconds === "number" &&
      Number.isFinite(leg.durationSeconds) &&
      leg.durationSeconds >= 0 &&
      typeof leg.realtime === "boolean" &&
      typeof leg.isPublicTransport === "boolean" &&
      [leg.fromName, leg.toName, leg.lineName].every(
        (text) => text === undefined || typeof text === "string",
      ),
  );
}

const ATTRIBUTION_LINKS = {
  entur: "https://entur.no/",
  nlod: "https://data.norge.no/nlod/en/2.0",
  osm: "https://www.openstreetmap.org/copyright",
} as const;

// The localized sentence holds {entur}, {nlod} and {osm}; each becomes a safely opened link.
function renderAttribution(labels: Labels) {
  return labels.attribution
    .split(/(\{(?:entur|nlod|osm)\})/)
    .map((part, index) => {
      const key = /^\{(entur|nlod|osm)\}$/.exec(part)?.[1] as
        | keyof typeof ATTRIBUTION_LINKS
        | undefined;
      if (!key) return part;
      const text = {
        entur: labels.attributionEntur,
        nlod: labels.attributionNlod,
        osm: labels.attributionOsm,
      }[key];
      return (
        <a
          key={index}
          href={ATTRIBUTION_LINKS[key]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {text}
        </a>
      );
    });
}

async function post(
  path: string,
  body: unknown,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
    cache: "no-store",
  });
  if (response.status === 429) throw new Error("rateLimited");
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("failure");
  }
  if (!response.ok || !isRecord(data) || data.ok !== true) {
    const code = isRecord(data) ? data.code : undefined;
    throw new Error(
      code === "no_journeys"
        ? "noJourneys"
        : code === "timeout"
          ? "timeout"
          : "failure",
    );
  }
  return data;
}

export default function TravelHelp({ destination, language, labels: suppliedLabels, defaultOpen = false }: Props) {
  const labels = getTravelHelpLabels(language, suppliedLabels);
  const id = useId();
  const [available, setAvailable] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<OriginSuggestion[]>([]);
  const [origin, setOrigin] = useState<OriginSuggestion>();
  const [originStatus, setOriginStatus] = useState("");
  const [journeyStatus, setJourneyStatus] = useState("");
  const [loadingOrigins, setLoadingOrigins] = useState(false);
  const [loadingJourneys, setLoadingJourneys] = useState(false);
  const [leaveNow, setLeaveNow] = useState(true);
  const [localTime, setLocalTime] = useState("");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const originRequest = useRef<AbortController | null>(null);
  const journeyRequest = useRef<AbortController | null>(null);
  const originSequence = useRef(0);
  const journeySequence = useRef(0);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const disclosureButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const mapKey = "mapKey" in destination ? destination.mapKey : undefined;
  const placeKey = "placeKey" in destination ? destination.placeKey : undefined;

  useEffect(() => {
    const controller = new AbortController();
    setAvailable(false);
    setDisclosureOpen(false);
    setQuery("");
    setSuggestions([]);
    setOrigin(undefined);
    setOriginStatus("");
    setJourneyStatus("");
    setJourneys([]);
    setLoadingOrigins(false);
    setLoadingJourneys(false);
    post("/api/entur/availability", destination, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setAvailable(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => {
      controller.abort();
      originSequence.current++;
      journeySequence.current++;
      originRequest.current?.abort();
      journeyRequest.current?.abort();
    };
  }, [destination.type, destination.id, mapKey, placeKey]);

  useEffect(() => {
    if (journeys.length) resultsHeading.current?.focus();
  }, [journeys]);

  useEffect(() => {
    const element = dialog.current;
    if (!disclosureOpen || !available || !element) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    closeButton.current?.focus();
    const keepFocus = (event: FocusEvent) => {
      if (event.target instanceof window.Node && !element.contains(event.target)) closeButton.current?.focus();
    };
    document.addEventListener("focusin", keepFocus);
    return () => {
      document.removeEventListener("focusin", keepFocus);
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
      if (disclosureButton.current?.isConnected) disclosureButton.current.focus();
    };
  }, [disclosureOpen, available]);

  const message = (error: unknown) => {
    const kind =
      error instanceof Error ? (error.message as ErrorKind) : "failure";
    return kind === "timeout" || kind === "rateLimited" || kind === "noJourneys"
      ? labels[kind]
      : labels.failure;
  };

  const invalidateOrigin = (value: string) => {
    setQuery(value);
    setOrigin(undefined);
    setSuggestions([]);
    setOriginStatus("");
    setJourneys([]);
    originSequence.current++;
    journeySequence.current++;
    originRequest.current?.abort();
    journeyRequest.current?.abort();
    setLoadingOrigins(false);
    setLoadingJourneys(false);
  };

  const searchOrigins = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = parseOriginQuery({ query });
    originRequest.current?.abort();
    journeyRequest.current?.abort();
    journeySequence.current++;
    setLoadingJourneys(false);
    setJourneyStatus("");
    const sequence = ++originSequence.current;
    setOrigin(undefined);
    setSuggestions([]);
    setJourneys([]);
    if (!text) {
      setOriginStatus(labels.invalidOrigin);
      return;
    }
    const controller = new AbortController();
    originRequest.current = controller;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 12_000);
    setLoadingOrigins(true);
    setOriginStatus(labels.searching);
    try {
      const data = await post(
        "/api/entur/origins",
        { query: text },
        controller.signal,
      );
      if (
        !isRecord(data) ||
        !Array.isArray(data.suggestions) ||
        data.suggestions.length > 8 ||
        !data.suggestions.every(isSuggestion)
      )
        throw new Error("failure");
      if (sequence !== originSequence.current) return;
      setSuggestions(data.suggestions);
      setOriginStatus(
        data.suggestions.length ? labels.placesFound : labels.noOrigins,
      );
    } catch (error) {
      if (
        sequence === originSequence.current &&
        (!controller.signal.aborted || timedOut)
      )
        setOriginStatus(timedOut ? labels.timeout : message(error));
    } finally {
      clearTimeout(timer);
      if (sequence === originSequence.current) setLoadingOrigins(false);
    }
  };

  const searchJourneys = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    journeyRequest.current?.abort();
    const sequence = ++journeySequence.current;
    setJourneys([]);
    if (!origin) {
      setJourneyStatus(labels.chooseOrigin);
      return;
    }
    const dateTime = leaveNow
      ? new Date().toISOString()
      : osloLocalToInstant(localTime);
    if (!dateTime) {
      setJourneyStatus(labels.invalidTime);
      return;
    }
    const controller = new AbortController();
    journeyRequest.current = controller;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 12_000);
    setLoadingJourneys(true);
    setJourneyStatus(labels.planning);
    try {
      const data = await post(
        "/api/entur/journeys",
        {
          origin: origin.coordinates,
          destination,
          dateTime,
          mode: "departAfter",
        },
        controller.signal,
      );
      if (
        !isRecord(data) ||
        !Array.isArray(data.journeys) ||
        data.journeys.length > 3 ||
        !data.journeys.every((journey) => isJourney(journey, labels))
      )
        throw new Error("failure");
      if (sequence !== journeySequence.current) return;
      setJourneys(data.journeys);
      setJourneyStatus(data.journeys.length ? "" : labels.noJourneys);
    } catch (error) {
      if (
        sequence === journeySequence.current &&
        (!controller.signal.aborted || timedOut)
      )
        setJourneyStatus(timedOut ? labels.timeout : message(error));
    } finally {
      clearTimeout(timer);
      if (sequence === journeySequence.current) setLoadingJourneys(false);
    }
  };

  if (!available) return null;
  const time = (value: string) => {
    const formatted = formatJourneyTimes(value, value, language);
    return `${formatted.departureDate}, ${formatted.departureTime}`;
  };
  const minutes = (seconds: number) =>
    `${Math.round(seconds / 60)} ${labels.minutes}`;
  const changeTime = () => {
    journeySequence.current++;
    journeyRequest.current?.abort();
    setLoadingJourneys(false);
    setJourneyStatus("");
    setJourneys([]);
  };
  const statusClass = (text: string) =>
    text === labels.searching || text === labels.planning
      ? "travel-help__status travel-help__status--loading"
      : text === labels.noOrigins ||
          text === labels.invalidOrigin ||
          text === labels.invalidTime ||
          text === labels.chooseOrigin ||
          text === labels.failure ||
          text === labels.timeout ||
          text === labels.rateLimited ||
          text === labels.noJourneys
        ? "travel-help__status travel-help__status--error"
        : "travel-help__status";
  return (
    <details className="travel-help" open={defaultOpen || undefined} onToggle={(event) => {
      if (!event.currentTarget.open) setDisclosureOpen(false);
    }}>
      <summary>{labels.title}</summary>
      <div className="travel-help__body">
        <form
          className="travel-help__origin-form"
          onSubmit={searchOrigins}
          aria-busy={loadingOrigins}
        >
          <label htmlFor={`${id}-origin`}>{labels.origin}</label>
          <div className="travel-help__search-row">
            <input
              id={`${id}-origin`}
              value={query}
              maxLength={100}
              placeholder={labels.originHelper}
              aria-describedby={`${id}-origin-status`}
              onChange={(event) => invalidateOrigin(event.target.value)}
            />
            <button
              className="travel-help__secondary-button"
              type="submit"
              disabled={loadingOrigins}
              aria-busy={loadingOrigins}
            >
              {labels.search}
            </button>
          </div>
        </form>
        <p
          id={`${id}-origin-status`}
          className={statusClass(originStatus)}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {originStatus}
        </p>
        {suggestions.length > 0 && (
          <fieldset className="travel-help__suggestions">
            <legend>{labels.select}</legend>
            <div className="travel-help__suggestion-list">
              {suggestions.map((item, index) => (
                <label
                  className={`travel-help__suggestion${origin === item ? " is-selected" : ""}`}
                  key={`${item.id ?? item.label}-${index}`}
                >
                  <input
                    type="radio"
                    name={`${id}-suggestion`}
                    checked={origin === item}
                    onChange={() => {
                      setOrigin(item);
                      setOriginStatus(
                        `${labels.originSelected}: ${item.label}`,
                      );
                      setJourneys([]);
                      setJourneyStatus("");
                      journeySequence.current++;
                      journeyRequest.current?.abort();
                      setLoadingJourneys(false);
                    }}
                  />
                  <span className="travel-help__suggestion-name">
                    {item.label}
                  </span>
                  {item.locality && !item.label.includes(item.locality) && (
                    <span className="travel-help__suggestion-locality">
                      {item.locality}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <form
          className="travel-help__journey-form"
          onSubmit={searchJourneys}
          aria-busy={loadingJourneys}
        >
          <fieldset className="travel-help__time-options">
            <legend>{labels.date}</legend>
            <label className="travel-help__time-option">
              <input
                type="radio"
                name={`${id}-time`}
                checked={leaveNow}
                onChange={() => {
                  changeTime();
                  setLeaveNow(true);
                }}
              />
              {labels.now}
            </label>
            <label className="travel-help__time-option">
              <input
                type="radio"
                name={`${id}-time`}
                checked={!leaveNow}
                onChange={() => {
                  changeTime();
                  setLeaveNow(false);
                }}
              />
              {labels.later}
            </label>
            {!leaveNow && (
              <div className="travel-help__datetime-field">
                <label htmlFor={`${id}-datetime`}>{labels.datetime}</label>
                <input
                  id={`${id}-datetime`}
                  type="datetime-local"
                  value={localTime}
                  aria-describedby={`${id}-datetime-help`}
                  onChange={(event) => {
                    changeTime();
                    setLocalTime(event.target.value);
                  }}
                />
                <small id={`${id}-datetime-help`}>{labels.datetimeHelp}</small>
              </div>
            )}
          </fieldset>
          <button
            className="travel-help__primary-button"
            type="submit"
            disabled={loadingJourneys || !origin}
            aria-busy={loadingJourneys}
          >
            {labels.find}
          </button>
        </form>
        <p
          className={statusClass(journeyStatus)}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {journeyStatus}
        </p>
        {journeys.length > 0 && (
          <section
            className="travel-help__results"
            aria-labelledby={`${id}-results-heading`}
          >
            <h3 id={`${id}-results-heading`} ref={resultsHeading} tabIndex={-1}>
              {labels.results}
            </h3>
            {journeys.map((journey, index) => {
              const formatted = formatJourneyTimes(journey.startTime, journey.endTime, language);
              return (
              <article
                className={`travel-help__journey travel-help__journey--${index % 2 === 0 ? "odd" : "even"}`}
                key={`${journey.startTime}-${index}`}
                aria-labelledby={`${id}-journey-${index}`}
              >
                <h4
                  id={`${id}-journey-${index}`}
                  className="travel-help__journey-heading"
                >
                  {interpolate(labels.alternative, {number: index + 1})}
                </h4>
                {formatted.sameDay && <p className="travel-help__journey-date">{formatted.departureDate}</p>}
                <div className="travel-help__journey-times">
                  <p>
                    <span>{labels.departure}</span>
                    {!formatted.sameDay && <span>{formatted.departureDate}</span>}
                    <strong><time dateTime={journey.startTime}>{formatted.departureTime}</time></strong>
                  </p>
                  <span
                    className="travel-help__journey-arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                  <p>
                    <span>{labels.arrival}</span>
                    {!formatted.sameDay && <span>{formatted.arrivalDate}</span>}
                    <strong><time dateTime={journey.endTime}>{formatted.arrivalTime}</time></strong>
                  </p>
                </div>
                <dl className="travel-help__journey-stats">
                  <div>
                    <dt>{labels.duration}</dt>
                    <dd>{minutes(journey.durationSeconds)}</dd>
                  </div>
                  <div>
                    <dt>{labels.transfers}</dt>
                    <dd>{journey.transfers}</dd>
                  </div>
                  {journey.walkingDurationSeconds !== undefined && (
                    <div>
                      <dt>{labels.walk}</dt>
                      <dd>{minutes(journey.walkingDurationSeconds)}</dd>
                    </div>
                  )}
                </dl>
                <details className="travel-help__journey-details">
                  <summary>{labels.details}</summary>
                  <ol className="travel-help__legs">
                    {journey.legs.map((leg, legIndex) => (
                      <li className="travel-help__leg" key={legIndex}>
                        <div className="travel-help__leg-heading">
                          <strong>{labels.modes[leg.mode]}</strong>
                          {leg.lineName && (
                            <span className="travel-help__line">
                              {leg.lineName}
                            </span>
                          )}
                        </div>
                        <p className="travel-help__leg-time">
                          {time(leg.startTime)} – {time(leg.endTime)}
                        </p>
                        {(leg.fromName || leg.toName) && (
                          <p className="travel-help__leg-stops">
                            {leg.fromName && (
                              <span>
                                <span>{labels.from}: </span>
                                {leg.fromName}
                              </span>
                            )}
                            {leg.toName && (
                              <span>
                                <span>{labels.to}: </span>
                                {leg.toName}
                              </span>
                            )}
                          </p>
                        )}
                        {leg.realtime && (
                          <p className="travel-help__realtime">
                            {labels.realtime}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              </article>
            )})}
          </section>
        )}
        <p className="travel-help__notice">{labels.notice}</p>
        <button ref={disclosureButton} type="button" className="travel-help__disclosure"
          aria-haspopup="dialog" aria-controls={`${id}-disclosure`} onClick={() => setDisclosureOpen(true)}>
          {labels.disclosure}
        </button>
        <dialog ref={dialog} id={`${id}-disclosure`} className="travel-help__dialog"
          role="dialog" aria-modal="true" aria-labelledby={`${id}-disclosure-title`}
          onCancel={(event) => { event.preventDefault(); setDisclosureOpen(false); }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right ||
              event.clientY < rect.top || event.clientY > rect.bottom) setDisclosureOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const focusable = event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]");
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault(); last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault(); first?.focus();
            }
          }}>
          <div className="travel-help__dialog-content">
            <h4 id={`${id}-disclosure-title`}>{labels.disclosure}</h4>
            <p className="travel-help__privacy">{labels.privacy}</p>
            <p className="travel-help__attribution" data-travel-attribution>{renderAttribution(labels)}</p>
            <a href={language === "nb" ? "/nb/privacy/" : "/ne/privacy/"}>{labels.privacyPolicy}</a>
            <button ref={closeButton} type="button" onClick={() => setDisclosureOpen(false)}>{labels.closeDisclosure}</button>
          </div>
        </dialog>
      </div>
    </details>
  );
}
