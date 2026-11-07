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
  TransportMode,
} from "../../lib/entur/types";
import type { travelHelp } from "../../i18n/travelHelp";

type Labels = {
  [K in keyof typeof travelHelp.en]: K extends "modes"
    ? Record<TransportMode, string>
    : string;
};
type Props = {
  destination: JourneyRequest["destination"];
  language: "ne" | "nb";
  labels: Labels;
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

export default function TravelHelp({ destination, language, labels }: Props) {
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

  useEffect(() => {
    const controller = new AbortController();
    post("/api/entur/availability", destination, controller.signal)
      .then(() => setAvailable(true))
      .catch(() => setAvailable(false));
    return () => {
      controller.abort();
      originRequest.current?.abort();
      journeyRequest.current?.abort();
    };
  }, [destination.type, destination.id]);

  useEffect(() => {
    if (journeys.length) resultsHeading.current?.focus();
  }, [journeys]);

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
  const locale = language === "ne" ? "ne-NP" : "nb-NO";
  const time = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: "Europe/Oslo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
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
    <details className="travel-help">
      <summary>{labels.title}</summary>
      <div className="travel-help__body">
        <p className="travel-help__privacy">{labels.privacy}</p>
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
            {journeys.map((journey, index) => (
              <article
                className="travel-help__journey"
                key={`${journey.startTime}-${index}`}
                aria-labelledby={`${id}-journey-${index}`}
              >
                <h4
                  id={`${id}-journey-${index}`}
                  className="travel-help__journey-heading"
                >
                  {labels.alternative} {index + 1}
                </h4>
                <div className="travel-help__journey-times">
                  <p>
                    <span>{labels.departure}</span>
                    <strong>{time(journey.startTime)}</strong>
                  </p>
                  <span
                    className="travel-help__journey-arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                  <p>
                    <span>{labels.arrival}</span>
                    <strong>{time(journey.endTime)}</strong>
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
            ))}
          </section>
        )}
        <p className="travel-help__notice">{labels.notice}</p>
      </div>
    </details>
  );
}
