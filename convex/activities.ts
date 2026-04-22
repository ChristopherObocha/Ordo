import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const activityTypeValidator = v.union(
  v.literal("mass"),
  v.literal("confessions"),
  v.literal("exposition"),
  v.literal("evening_prayer"),
  v.literal("baptism"),
  v.literal("vespers"),
  v.literal("other"),
);

const scheduleValidator = v.union(
  v.literal("weekday"),
  v.literal("saturday"),
  v.literal("sunday"),
  v.literal("vigil"),
  v.literal("specific"),
);

const liturgicalColourValidator = v.union(
  v.literal("white"),
  v.literal("red"),
  v.literal("green"),
  v.literal("purple"),
  v.literal("rose"),
  v.literal("marian_white"),
  v.literal("black"),
);

async function assertPrivileged(
  ctx: MutationCtx | QueryCtx,
  parishId: Id<"parishes">,
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthenticated");
  const membership = await ctx.db
    .query("parishMembers")
    .withIndex("by_parish", (q) => q.eq("parishId", parishId))
    .filter((q) => q.eq(q.field("userId"), userId))
    .unique();
  if (!membership || (membership.role !== "parish_priest" && membership.role !== "administrator"))
    throw new Error("Unauthorised: admin or parish priest role required");
  return userId;
}

export const list = query({
  args: {
    parishId: v.id("parishes"),
    churchId: v.optional(v.id("churches")),
    schedule: v.optional(scheduleValidator),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("activities")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId));

    const results = await q.collect();

    return results
      .filter((a) => a.isActive)
      .filter((a) => !args.churchId || a.churchId === args.churchId)
      .filter((a) => !args.schedule || a.schedule === args.schedule)
      .sort((a, b) => a.time.localeCompare(b.time));
  },
});

export const getById = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.activityId);
  },
});

export const create = mutation({
  args: {
    parishId: v.id("parishes"),
    churchId: v.id("churches"),
    type: activityTypeValidator,
    name: v.optional(v.string()),
    schedule: scheduleValidator,
    time: v.string(),
    specificDate: v.optional(v.number()),
    isVigil: v.boolean(),
    liturgicalColour: v.optional(liturgicalColourValidator),
    requiredClergyCount: v.number(),
    requiredRoles: v.array(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertPrivileged(ctx, args.parishId);

    const church = await ctx.db.get(args.churchId);
    if (!church || church.parishId !== args.parishId)
      throw new Error("Church does not belong to this parish");

    if (args.schedule === "specific" && args.specificDate === undefined)
      throw new Error("specificDate is required when schedule is 'specific'");

    return await ctx.db.insert("activities", {
      ...args,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    activityId: v.id("activities"),
    type: v.optional(activityTypeValidator),
    name: v.optional(v.string()),
    schedule: v.optional(scheduleValidator),
    time: v.optional(v.string()),
    specificDate: v.optional(v.number()),
    isVigil: v.optional(v.boolean()),
    liturgicalColour: v.optional(liturgicalColourValidator),
    requiredClergyCount: v.optional(v.number()),
    requiredRoles: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    churchId: v.optional(v.id("churches")),
  },
  handler: async (ctx, args) => {
    const { activityId, ...fields } = args;

    const activity = await ctx.db.get(activityId);
    if (!activity) throw new Error("Activity not found");

    await assertPrivileged(ctx, activity.parishId);

    if (fields.churchId) {
      const church = await ctx.db.get(fields.churchId);
      if (!church || church.parishId !== activity.parishId)
        throw new Error("Church does not belong to this parish");
    }

    const effectiveSchedule = fields.schedule ?? activity.schedule;
    const effectiveSpecificDate = fields.specificDate ?? activity.specificDate;
    if (effectiveSchedule === "specific" && effectiveSpecificDate === undefined)
      throw new Error("specificDate is required when schedule is 'specific'");

    await ctx.db.patch(activityId, fields);
    return activityId;
  },
});

export const deactivate = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    await assertPrivileged(ctx, activity.parishId);
    await ctx.db.patch(args.activityId, { isActive: false });
    return args.activityId;
  },
});

export const remove = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    await assertPrivileged(ctx, activity.parishId);

    const existingAssignment = await ctx.db
      .query("assignments")
      .filter((q) => q.eq(q.field("activityId"), args.activityId))
      .first();

    if (existingAssignment)
      throw new Error(
        "Cannot delete an activity that has assignments. Use deactivate instead.",
      );

    await ctx.db.delete(args.activityId);
    return args.activityId;
  },
});
