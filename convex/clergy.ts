import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("clergy").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clergy", {
      name: args.name,
      type: args.type,
    });
  },
});