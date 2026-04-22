import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

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
