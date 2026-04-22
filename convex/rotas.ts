import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getForWeek = query({
  args: { parishId: v.id("parishes"), startDate: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rotas")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .filter((q) => q.eq(q.field("startDate"), args.startDate))
      .first();
  },
});

export const listForParish = query({
  args: { parishId: v.id("parishes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rotas")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    parishId: v.id("parishes"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("rotas")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .filter((q) => q.eq(q.field("startDate"), args.startDate))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("rotas", {
      ...args,
      status: "draft",
      generatedBy: "manual",
      createdBy: userId,
    });
  },
});

export const getForRange = query({
  args: {
    parishId: v.id("parishes"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rotas")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startDate"), args.startDate),
          q.lte(q.field("endDate"), args.endDate)
        )
      )
      .collect();
  },
});

export const updateStatus = mutation({
  args: {
    rotaId: v.id("rotas"),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    await ctx.db.patch(args.rotaId, {
      status: args.status,
      ...(args.status === "published" ? { publishedAt: Date.now() } : {}),
    });
    return args.rotaId;
  },
});
