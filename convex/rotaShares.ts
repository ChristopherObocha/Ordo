import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createShare = mutation({
  args: { rotaId: v.id("rotas") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const token = crypto.randomUUID();
    await ctx.db.insert("rotaShares", {
      rotaId: args.rotaId,
      token,
      createdBy: userId,
    });
    return token;
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("rotaShares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!share) return null;
    const rota = await ctx.db.get(share.rotaId);
    return { share, rota };
  },
});

export const listForRota = query({
  args: { rotaId: v.id("rotas") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("rotaShares")
      .filter((q) => q.eq(q.field("rotaId"), args.rotaId))
      .collect();
  },
});
