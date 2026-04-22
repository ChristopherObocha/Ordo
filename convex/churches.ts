import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    parishId: v.id("parishes"),
    name: v.string(),
    type: v.union(
      v.literal("parish_church"),
      v.literal("outstation"),
      v.literal("chapel"),
      v.literal("oratory"),
    ),
    isMain: v.optional(v.boolean()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("churches", {
      parishId: args.parishId,
      name: args.name,
      type: args.type,
      isMain: args.isMain ?? false,
      address: args.address,
    });
  },
});

export const updateName = mutation({
  args: {
    churchId: v.id("churches"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(args.churchId, { name: args.name });
    return args.churchId;
  },
});

export const getMain = query({
  args: { parishId: v.id("parishes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("churches")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .filter((q) => q.eq(q.field("isMain"), true))
      .first();
  },
});

export const list = query({
  args: { parishId: v.id("parishes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("churches")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .collect();
  },
});
