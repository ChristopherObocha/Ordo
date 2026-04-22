import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listForRota = query({
  args: { rotaId: v.id("rotas") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignments")
      .withIndex("by_rota", (q) => q.eq("rotaId", args.rotaId))
      .collect();
  },
});

export const assign = mutation({
  args: {
    rotaId: v.id("rotas"),
    parishId: v.id("parishes"),
    activityId: v.id("activities"),
    clergyId: v.id("clergy"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("assignments")
      .withIndex("by_rota", (q) => q.eq("rotaId", args.rotaId))
      .filter((q) =>
        q.and(
          q.eq(q.field("activityId"), args.activityId),
          q.eq(q.field("date"), args.date),
        ),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        clergyId: args.clergyId,
        status: "assigned",
      });
      return existing._id;
    }

    return await ctx.db.insert("assignments", {
      ...args,
      status: "assigned",
      hasViolation: false,
    });
  },
});

export const unassign = mutation({
  args: {
    rotaId: v.id("rotas"),
    activityId: v.id("activities"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("assignments")
      .withIndex("by_rota", (q) => q.eq("rotaId", args.rotaId))
      .filter((q) =>
        q.and(
          q.eq(q.field("activityId"), args.activityId),
          q.eq(q.field("date"), args.date),
        ),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
