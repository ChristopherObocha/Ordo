import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";

// --- Helpers ---

function expandDates(startDate: string, endDate: string): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (current <= end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function activityAppliesOnDate(
  activity: Doc<"activities">,
  date: Date,
): boolean {
  const dow = date.getUTCDay(); // 0=Sunday .. 6=Saturday
  switch (activity.schedule) {
    case "weekday":
      return dow >= 1 && dow <= 5;
    case "saturday":
      return dow === 6;
    case "sunday":
      return dow === 0;
    case "vigil":
      // Vigil masses happen Saturday evening (counts toward Sunday liturgy).
      return dow === 6;
    case "specific": {
      if (activity.specificDate === undefined) return false;
      const specific = new Date(activity.specificDate);
      return isoDate(specific) === isoDate(date);
    }
    default:
      return false;
  }
}

function clergyAvailableOnDay(
  clergyId: Id<"clergy">,
  dayOfWeek: number,
  availabilityByClergy: Map<string, Doc<"availability">[]>,
): boolean {
  const records = availabilityByClergy.get(clergyId);
  // Default: if no records, clergy is available every day.
  if (!records || records.length === 0) return true;
  return records.some((r) => r.dayOfWeek === dayOfWeek);
}

function clergyHasRequiredRole(
  clergy: Doc<"clergy">,
  requiredRoles: string[],
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return clergy.roles.some((role) => requiredRoles.includes(role));
}

function clergyPassesDefaultHardRules(
  clergy: Doc<"clergy">,
  activity: Doc<"activities">,
): boolean {
  if (activity.type === "mass" || activity.type === "confessions") {
    return clergy.type === "priest" || clergy.type === "bishop";
  }
  return true;
}

// --- Internal query: load everything in a single snapshot ---

export const loadGenerationData = internalQuery({
  args: { parishId: v.id("parishes") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .collect();

    const clergy = await ctx.db
      .query("clergy")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .collect();

    const rules = await ctx.db
      .query("rules")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .collect();

    // Load availability per clergy (indexed by clergyId).
    const availability: Doc<"availability">[] = [];
    for (const c of clergy) {
      const recs = await ctx.db
        .query("availability")
        .withIndex("by_clergy", (q) => q.eq("clergyId", c._id))
        .collect();
      availability.push(...recs);
    }

    return {
      activities: activities.filter((a) => a.isActive),
      clergy: clergy.filter((c) => c.status === "active"),
      availability,
      rules: rules.filter((r) => r.enabled),
    };
  },
});

// --- Internal mutation: create rota + bulk insert assignments ---

export const createRotaAndAssignments = internalMutation({
  args: {
    parishId: v.id("parishes"),
    startDate: v.string(),
    endDate: v.string(),
    createdBy: v.id("users"),
    assignments: v.array(
      v.object({
        activityId: v.id("activities"),
        clergyId: v.id("clergy"),
        date: v.string(),
        hasViolation: v.boolean(),
        violationDetail: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const rotaId = await ctx.db.insert("rotas", {
      parishId: args.parishId,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "draft",
      generatedBy: "auto",
      createdBy: args.createdBy,
    });

    for (const a of args.assignments) {
      await ctx.db.insert("assignments", {
        rotaId,
        parishId: args.parishId,
        activityId: a.activityId,
        clergyId: a.clergyId,
        date: a.date,
        status: "assigned",
        hasViolation: a.hasViolation,
        violationDetail: a.violationDetail,
      });
    }

    return rotaId;
  },
});

// --- Main action: generateRota ---

export const generateRota = action({
  args: {
    parishId: v.id("parishes"),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(), // YYYY-MM-DD
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    rotaId: Id<"rotas">;
    assignedCount: number;
    violationSlots: Array<{
      activityId: Id<"activities">;
      date: string;
      reason: string;
    }>;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // 1. Load data.
    const data = await ctx.runQuery(internal.rotaGeneration.loadGenerationData, {
      parishId: args.parishId,
    });

    const { activities, clergy, availability } = data as {
      activities: Doc<"activities">[];
      clergy: Doc<"clergy">[];
      availability: Doc<"availability">[];
      rules: Doc<"rules">[];
    };

    // Index availability by clergyId for fast lookup.
    const availabilityByClergy = new Map<string, Doc<"availability">[]>();
    for (const a of availability) {
      const key = a.clergyId as unknown as string;
      const list = availabilityByClergy.get(key) ?? [];
      list.push(a);
      availabilityByClergy.set(key, list);
    }

    // 2. Expand slots.
    const dates = expandDates(args.startDate, args.endDate);

    // Round-robin tracking: assignments-so-far per clergy across the run.
    const assignmentCount = new Map<string, number>();
    for (const c of clergy) {
      assignmentCount.set(c._id as unknown as string, 0);
    }

    // Per-activity rotation cursor so each activity cycles through its
    // eligible clergy in a stable round-robin order.
    const activityCursor = new Map<string, number>();

    const assignmentsToInsert: Array<{
      activityId: Id<"activities">;
      clergyId: Id<"clergy">;
      date: string;
      hasViolation: boolean;
      violationDetail?: string;
    }> = [];

    const violationSlots: Array<{
      activityId: Id<"activities">;
      date: string;
      reason: string;
    }> = [];

    // 3 + 4 + 5. For each activity, walk every applicable date and assign.
    for (const activity of activities) {
      for (const date of dates) {
        if (!activityAppliesOnDate(activity, date)) continue;

        const dow = date.getUTCDay();
        const dateStr = isoDate(date);

        // Filter eligible clergy.
        const eligible = clergy.filter((c) => {
          if (c.status !== "active") return false;
          if (!clergyAvailableOnDay(c._id, dow, availabilityByClergy)) {
            return false;
          }
          if (!clergyHasRequiredRole(c, activity.requiredRoles)) return false;
          if (!clergyPassesDefaultHardRules(c, activity)) return false;
          return true;
        });

        const required = Math.max(1, activity.requiredClergyCount || 1);

        if (eligible.length === 0) {
          // No eligible clergy — record a violation slot for each required
          // position. We cannot insert assignments without a clergyId,
          // so these are surfaced only through the return value.
          for (let i = 0; i < required; i++) {
            violationSlots.push({
              activityId: activity._id,
              date: dateStr,
              reason:
                "No eligible clergy for activity on this date (role, availability, or type constraints).",
            });
          }
          continue;
        }

        // Sort eligible clergy by current assignment count (load balancing),
        // with the per-activity cursor providing a stable rotation tiebreaker.
        const activityKey = activity._id as unknown as string;
        const cursor = activityCursor.get(activityKey) ?? 0;

        // Pick `required` distinct clergy from eligible, rotating.
        const picks: Doc<"clergy">[] = [];
        const used = new Set<string>();

        // First, sort eligible by load (ascending) so least-loaded go first.
        const sortedEligible = [...eligible].sort((a, b) => {
          const aCount =
            assignmentCount.get(a._id as unknown as string) ?? 0;
          const bCount =
            assignmentCount.get(b._id as unknown as string) ?? 0;
          return aCount - bCount;
        });

        // Round-robin offset within sortedEligible.
        for (let i = 0; i < sortedEligible.length && picks.length < required; i++) {
          const idx = (cursor + i) % sortedEligible.length;
          const candidate = sortedEligible[idx];
          const cKey = candidate._id as unknown as string;
          if (used.has(cKey)) continue;
          picks.push(candidate);
          used.add(cKey);
        }

        // Advance the activity cursor for next date.
        activityCursor.set(
          activityKey,
          (cursor + picks.length) % Math.max(1, sortedEligible.length),
        );

        for (const chosen of picks) {
          const cKey = chosen._id as unknown as string;
          assignmentCount.set(cKey, (assignmentCount.get(cKey) ?? 0) + 1);
          assignmentsToInsert.push({
            activityId: activity._id,
            clergyId: chosen._id,
            date: dateStr,
            hasViolation: false,
          });
        }

        // If we could not fully satisfy requiredClergyCount, the unfilled
        // positions become violation slots.
        const shortfall = required - picks.length;
        for (let i = 0; i < shortfall; i++) {
          violationSlots.push({
            activityId: activity._id,
            date: dateStr,
            reason: "Not enough eligible clergy to meet requiredClergyCount.",
          });
        }
      }
    }

    // 6. Persist rota + assignments in a single mutation.
    const rotaId: Id<"rotas"> = await ctx.runMutation(
      internal.rotaGeneration.createRotaAndAssignments,
      {
        parishId: args.parishId,
        startDate: args.startDate,
        endDate: args.endDate,
        createdBy: userId,
        assignments: assignmentsToInsert,
      },
    );

    return {
      rotaId,
      assignedCount: assignmentsToInsert.length,
      violationSlots,
    };
  },
});
