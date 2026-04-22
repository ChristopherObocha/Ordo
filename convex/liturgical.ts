"use node";

import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Helper: generate calendar data using romcal
// ---------------------------------------------------------------------------

interface LiturgicalDayInfo {
  name: string;
  season: string;
  color: string;
  rank: string;
  key?: string;
  type?: string;
  source?: string;
  titles?: string[];
}

async function generateCalendarData(
  year: number,
  locale: string
): Promise<Record<string, LiturgicalDayInfo>> {
  // romcal is a CommonJS Node.js package — require it here inside the
  // "use node" action context.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const romcal = require("romcal");

  const calendarFor: (opts: Record<string, unknown>) => Promise<unknown[]> | unknown[] =
    romcal.calendarFor;

  // calendarFor may return a Promise or a plain array depending on romcal version
  const raw = await Promise.resolve(
    calendarFor({
      year,
      locale,
      type: "calendar", // Jan 1 – Dec 31 civil year
    })
  );

  const result: Record<string, LiturgicalDayInfo> = {};

  for (const entry of raw as Record<string, unknown>[]) {
    // moment field is either an ISO string or a Moment object
    const momentField = entry["moment"] as { format?: (s: string) => string } | string;
    let dateStr: string;

    if (typeof momentField === "string") {
      // ISO8601 string — take only the date part
      dateStr = momentField.slice(0, 10);
    } else if (momentField && typeof momentField.format === "function") {
      dateStr = momentField.format("YYYY-MM-DD");
    } else {
      // Fallback: skip entries with unparseable dates
      continue;
    }

    const data = entry["data"] as
      | {
          season?: string;
          meta?: {
            liturgicalColor?: { key?: string; value?: string } | string;
            titles?: string[];
          };
        }
      | undefined;

    const season = (data?.season as string) ?? "";
    const colorRaw = data?.meta?.liturgicalColor;
    let color: string;
    if (typeof colorRaw === "string") {
      color = colorRaw;
    } else if (colorRaw && typeof colorRaw === "object") {
      color = (colorRaw.key as string) ?? (colorRaw.value as string) ?? "";
    } else {
      color = "";
    }
    const titles = data?.meta?.titles ?? [];

    // Use the first entry per date (romcal can emit multiple per day — highest
    // ranked first when the array is not grouped)
    if (!result[dateStr]) {
      result[dateStr] = {
        name: (entry["name"] as string) ?? "",
        season,
        color,
        rank: (entry["type"] as string) ?? "",
        key: (entry["key"] as string) ?? undefined,
        type: (entry["type"] as string) ?? undefined,
        source: (entry["source"] as string) ?? undefined,
        titles: titles as string[],
      };
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Internal mutation: write cached liturgical year
// ---------------------------------------------------------------------------

export const storeLiturgicalYear = internalMutation({
  args: {
    year: v.number(),
    locale: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("liturgicalCache", {
      year: args.year,
      locale: args.locale,
      data: args.data,
    });
  },
});

// ---------------------------------------------------------------------------
// Internal query: read cached liturgical year
// ---------------------------------------------------------------------------

export const getLiturgicalYear = internalQuery({
  args: { year: v.number(), locale: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liturgicalCache")
      .withIndex("by_year_locale", (q) =>
        q.eq("year", args.year).eq("locale", args.locale)
      )
      .unique();
  },
});

// ---------------------------------------------------------------------------
// Public query: same as getLiturgicalYear but exposed to the UI
// ---------------------------------------------------------------------------

export const get = query({
  args: { year: v.number(), locale: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liturgicalCache")
      .withIndex("by_year_locale", (q) =>
        q.eq("year", args.year).eq("locale", args.locale)
      )
      .unique();
  },
});

// ---------------------------------------------------------------------------
// Public action: generate (or return cached) liturgical year data
// ---------------------------------------------------------------------------

export const generateLiturgicalYear = action({
  args: {
    year: v.number(),
    locale: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Check cache first
    const cached = await ctx.runQuery(internal.liturgical.getLiturgicalYear, {
      year: args.year,
      locale: args.locale,
    });
    if (cached) return cached.data;

    // 2. Generate with romcal (Node.js runtime required)
    const data = await generateCalendarData(args.year, args.locale);

    // 3. Store and return
    await ctx.runMutation(internal.liturgical.storeLiturgicalYear, {
      year: args.year,
      locale: args.locale,
      data,
    });
    return data;
  },
});
