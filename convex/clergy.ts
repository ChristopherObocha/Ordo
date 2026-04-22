import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { parishId: v.id("parishes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clergy")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .collect();
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("clergy")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const invite = mutation({
  args: {
    parishId: v.id("parishes"),
    name: v.string(),
    email: v.string(),
    type: v.union(
      v.literal("bishop"),
      v.literal("priest"),
      v.literal("deacon"),
      v.literal("religious"),
      v.literal("sister"),
    ),
    roles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check caller is parish priest
    const membership = await ctx.db
      .query("parishMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!membership || (membership.role !== "parish_priest" && membership.role !== "administrator")) {
      throw new Error("Only the parish priest or administrator can invite clergy");
    }

    // Check not already invited
    const existing = await ctx.db
      .query("clergy")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) throw new Error("This person has already been invited");

    const inviteToken = crypto.randomUUID();

    return await ctx.db.insert("clergy", {
      parishId: args.parishId,
      name: args.name,
      email: args.email,
      type: args.type,
      roles: args.roles,
      status: "pending",
      inviteToken,
    });
  },
});

export const acceptInvite = mutation({
  args: { inviteToken: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const clergy = await ctx.db
      .query("clergy")
      .withIndex("by_invite_token", (q) =>
        q.eq("inviteToken", args.inviteToken)
      )
      .unique();

    if (!clergy) throw new Error("Invalid invite token");
    if (clergy.status !== "pending") throw new Error("Invite already used");

    await ctx.db.patch(clergy._id, {
      userId,
      status: "active",
      inviteToken: undefined,
    });

    // Add to parishMembers
    await ctx.db.insert("parishMembers", {
      parishId: clergy.parishId,
      userId,
      role: "clergy",
    });

    return clergy._id;
  },
});

export const remove = mutation({
  args: { clergyId: v.id("clergy") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const membership = await ctx.db
      .query("parishMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!membership || membership.role !== "parish_priest") {
      throw new Error("Only the parish priest can remove clergy");
    }

    await ctx.db.delete(args.clergyId);
  },
});

export const setStatus = mutation({
  args: {
    clergyId: v.id("clergy"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(args.clergyId, { status: args.status });
    return args.clergyId;
  },
});

export const updateRoles = mutation({
  args: {
    clergyId: v.id("clergy"),
    roles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.clergyId, { roles: args.roles });
  },
});