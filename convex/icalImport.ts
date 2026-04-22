"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityType =
  | "mass"
  | "confessions"
  | "exposition"
  | "evening_prayer"
  | "baptism"
  | "vespers"
  | "other";

export type Schedule =
  | "weekday"
  | "saturday"
  | "sunday"
  | "vigil"
  | "specific";

export type ParsedEvent = {
  uid: string;
  title: string;
  dtstart: string;      // ISO date string YYYY-MM-DD
  time: string;         // HH:MM
  isRecurring: boolean;
  rrule?: string;       // raw RRULE string if recurring
  suggestedType: ActivityType;
  suggestedSchedule: Schedule;
};

// ---------------------------------------------------------------------------
// Categorisation helpers
// ---------------------------------------------------------------------------

function categoriseTitle(title: string): ActivityType {
  const t = title.toLowerCase();
  if (t.includes("mass") || t.includes("eucharist") || t.includes("liturgy")) {
    return "mass";
  }
  if (t.includes("confession") || t.includes("reconciliation") || t.includes("penance")) {
    return "confessions";
  }
  if (t.includes("exposition") || t.includes("adoration") || t.includes("benediction")) {
    return "exposition";
  }
  if (t.includes("evening prayer") || t.includes("compline")) {
    return "evening_prayer";
  }
  if (t.includes("baptism") || t.includes("bapti")) {
    return "baptism";
  }
  if (t.includes("vespers") || t.includes("solemn vespers")) {
    return "vespers";
  }
  return "other";
}

function categoriseSchedule(dayOfWeek: number, time: string): Schedule {
  // dayOfWeek: 0 = Sunday, 6 = Saturday, 1-5 = Mon-Fri
  if (dayOfWeek === 0) return "sunday";
  if (dayOfWeek === 6) {
    // Check if time is 17:00 or later → vigil
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + (minutes || 0);
    return totalMinutes >= 17 * 60 ? "vigil" : "saturday";
  }
  return "weekday";
}

// ---------------------------------------------------------------------------
// Main action
// ---------------------------------------------------------------------------

export const parseICalUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (_ctx, args): Promise<ParsedEvent[]> => {
    // 1. Fetch the iCal URL
    const response = await fetch(args.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal URL: ${response.status}`);
    }
    const icalText = await response.text();

    // 2. Parse with ical.js (CommonJS require pattern, same as romcal usage in liturgical.ts)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ICAL = require("ical.js");

    const jCal = ICAL.parse(icalText);
    const comp = new ICAL.Component(jCal);
    const vevents: unknown[] = comp.getAllSubcomponents("vevent");

    // 3. Map each VEVENT to ParsedEvent
    const events: ParsedEvent[] = vevents.map((vevent: unknown) => {
      const event = vevent as {
        getFirstPropertyValue: (name: string) => unknown;
        getFirstProperty: (name: string) => { getFirstValue: () => { toJSDate: () => Date } } | null;
      };

      // uid
      const uid = String(event.getFirstPropertyValue("uid") ?? "");

      // title / summary
      const title = String(event.getFirstPropertyValue("summary") ?? "");

      // dtstart — use the ICAL.Time object to get a JS Date
      const dtStartProp = event.getFirstProperty("dtstart");
      let jsDate: Date;
      if (dtStartProp) {
        jsDate = dtStartProp.getFirstValue().toJSDate();
      } else {
        jsDate = new Date(0);
      }

      // Format YYYY-MM-DD
      const year = jsDate.getFullYear();
      const month = String(jsDate.getMonth() + 1).padStart(2, "0");
      const day = String(jsDate.getDate()).padStart(2, "0");
      const dtstart = `${year}-${month}-${day}`;

      // Format HH:MM
      const hours = String(jsDate.getHours()).padStart(2, "0");
      const minutes = String(jsDate.getMinutes()).padStart(2, "0");
      const time = `${hours}:${minutes}`;

      // rrule — raw string if present
      const rruleProp = (vevent as { getFirstProperty: (name: string) => { toICALString?: () => string; getFirstValue?: () => unknown } | null }).getFirstProperty("rrule");
      let rrule: string | undefined;
      if (rruleProp) {
        // Prefer the string form; getFirstValue() returns an ICAL.Recur object
        const recur = rruleProp.getFirstValue?.();
        rrule = recur
          ? String((recur as { toString?: () => string }).toString?.() ?? "")
          : undefined;
        if (rrule === "") rrule = undefined;
      }

      const isRecurring = rrule !== undefined;

      // Day of week from JS Date (0 = Sunday)
      const dayOfWeek = jsDate.getDay();

      const suggestedType = categoriseTitle(title);
      const suggestedSchedule = categoriseSchedule(dayOfWeek, time);

      const parsed: ParsedEvent = {
        uid,
        title,
        dtstart,
        time,
        isRecurring,
        suggestedType,
        suggestedSchedule,
      };
      if (rrule !== undefined) {
        parsed.rrule = rrule;
      }
      return parsed;
    });

    // 4. Return array of ParsedEvent
    return events;
  },
});
