"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const romcal = require("romcal");

  const calendarFor: (opts: Record<string, unknown>) => Promise<unknown[]> | unknown[] =
    romcal.calendarFor;

  const raw = await Promise.resolve(
    calendarFor({ year, locale, type: "calendar" })
  );

  const result: Record<string, LiturgicalDayInfo> = {};

  for (const entry of raw as Record<string, unknown>[]) {
    const momentField = entry["moment"] as { format?: (s: string) => string } | string;
    let dateStr: string;

    if (typeof momentField === "string") {
      dateStr = momentField.slice(0, 10);
    } else if (momentField && typeof momentField.format === "function") {
      dateStr = momentField.format("YYYY-MM-DD");
    } else {
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

export const generateLiturgicalYear = action({
  args: {
    year: v.number(),
    locale: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<Record<string, LiturgicalDayInfo>> => {
    const cached = await ctx.runQuery(internal.liturgicalCache.getLiturgicalYear, {
      year: args.year,
      locale: args.locale,
    });
    if (cached) return cached.data as Record<string, LiturgicalDayInfo>;

    const data = await generateCalendarData(args.year, args.locale);

    await ctx.runMutation(internal.liturgicalCache.storeLiturgicalYear, {
      year: args.year,
      locale: args.locale,
      data,
    });
    return data;
  },
});
