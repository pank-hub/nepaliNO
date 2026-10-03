import assert from "node:assert/strict";
import test from "node:test";
import {
  expandUpcomingOccurrences,
  getAllDates,
  nextOccurrence,
} from "../../src/lib/eventOccurrences.ts";

const ev = {
  _id: "a",
  startDateTime: "2026-10-17T09:30:00Z",
  endDateTime: "2026-10-17T14:30:00Z",
  additionalDates: [
    {
      startDateTime: "2026-10-18T09:30:00Z",
      endDateTime: "2026-10-18T14:30:00Z",
    },
  ],
};
const t = (s) => new Date(s).getTime();

test("lists every date in order", () => {
  assert.equal(getAllDates({ ...ev, additionalDates: null }).length, 1);
  assert.deepEqual(
    getAllDates(ev).map((d) => d.startDateTime.slice(0, 10)),
    ["2026-10-17", "2026-10-18"],
  );
});

test("expands to one entry per upcoming date", () => {
  assert.equal(
    expandUpcomingOccurrences([ev], t("2026-10-10T00:00:00Z")).length,
    2,
  );
  const later = expandUpcomingOccurrences([ev], t("2026-10-17T20:00:00Z"));
  assert.equal(later.length, 1);
  assert.equal(later[0].startDateTime, "2026-10-18T09:30:00Z");
});

test("nextOccurrence picks next date, or the last when all are past", () => {
  assert.equal(
    nextOccurrence(ev, t("2026-10-17T20:00:00Z")).startDateTime,
    "2026-10-18T09:30:00Z",
  );
  assert.equal(
    nextOccurrence(ev, t("2026-11-01T00:00:00Z")).startDateTime,
    "2026-10-18T09:30:00Z",
  );
});
