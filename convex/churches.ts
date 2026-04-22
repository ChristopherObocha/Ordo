import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { parishId: v.id("parishes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("churches")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .collect();
  },
});
