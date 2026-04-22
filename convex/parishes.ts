import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("parish"),
      v.literal("cathedral"),
      v.literal("abbey"),
      v.literal("seminary"),
      v.literal("chaplaincy"),
      v.literal("shrine"),
    ),
    diocese: v.optional(v.string()),
    locale: v.string(),
    timezone: v.string(),
    membershipRole: v.optional(v.union(v.literal("parish_priest"), v.literal("administrator"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Create the parish
    const parishId = await ctx.db.insert("parishes", {
      ...args,
      createdBy: userId,
    });

    // Create the main church (placeholder — they can add details later)
    await ctx.db.insert("churches", {
      parishId,
      name: args.name,
      type: "parish_church",
      isMain: true,
    });

    // Make this user the parish priest (or administrator if specified)
    await ctx.db.insert("parishMembers", {
      parishId,
      userId,
      role: args.membershipRole ?? "parish_priest",
    });

    return parishId;
  },
});

export const getMyParish = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const membership = await ctx.db
      .query("parishMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!membership) return null;

    const parish = await ctx.db.get(membership.parishId);
    return parish ?? null;
  },
});