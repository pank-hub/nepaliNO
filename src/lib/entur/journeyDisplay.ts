const timeZone = "Europe/Oslo";

export function formatJourneyTimes(start: string, end: string, language: string) {
  const locale = language === "ne" ? "ne-NP" : language === "nb" ? "nb-NO" : "en-GB";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone, year: "numeric", month: "long", day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone, hour12: false, hour: "2-digit", minute: "2-digit",
  });
  const dayFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  });
  const departure = new Date(start);
  const arrival = new Date(end);
  return {
    sameDay: dayFormatter.format(departure) === dayFormatter.format(arrival),
    departureDate: dateFormatter.format(departure),
    arrivalDate: dateFormatter.format(arrival),
    departureTime: timeFormatter.format(departure),
    arrivalTime: timeFormatter.format(arrival),
  };
}
