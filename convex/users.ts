import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get the currently authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

// Called after sign-in to ensure a user record exists
export const ensureUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
    });
  },
});

// Update onboarding phase and step for the current user
export const updateOnboardingProgress = mutation({
  args: {
    phase: v.union(
      v.literal("setup"),
      v.literal("import"),
      v.literal("generate"),
      v.literal("complete"),
    ),
    step: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { onboardingPhase: args.phase, onboardingStep: args.step });
  },
});

// Get onboarding progress for the current user
export const getOnboardingProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return { phase: user.onboardingPhase, step: user.onboardingStep };
  },
});

// Get a user's role within a parish
export const getParishRole = query({
  args: { parishId: v.id("parishes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("parishMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("parishId"), args.parishId))
      .unique();
  },
});