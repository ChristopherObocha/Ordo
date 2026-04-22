import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // --- AUTH ---
  ...authTables, // ← adds authSessions, authAccounts etc

  // --- USERS ---
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    onboardingPhase: v.optional(v.union(
      v.literal("setup"),
      v.literal("import"),
      v.literal("generate"),
      v.literal("complete"),
    )),
    onboardingStep: v.optional(v.number()),
  }).index("by_email", ["email"]),

  // --- PARISHES ---
  parishes: defineTable({
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
    createdBy: v.id("users"),
  }),

  // --- PARISH MEMBERS ---
  parishMembers: defineTable({
    parishId: v.id("parishes"),
    userId: v.id("users"),
    role: v.union(
      v.literal("parish_priest"),
      v.literal("administrator"),
      v.literal("clergy"),
    ),
  })
    .index("by_parish", ["parishId"])
    .index("by_user", ["userId"]),

  // --- CHURCHES ---
  churches: defineTable({
    parishId: v.id("parishes"),
    name: v.string(),
    type: v.union(
      v.literal("parish_church"),
      v.literal("outstation"),
      v.literal("chapel"),
      v.literal("oratory"),
    ),
    address: v.optional(v.string()),
    isMain: v.boolean(),
  }).index("by_parish", ["parishId"]),

  // --- CHURCH DISTANCES ---
  churchDistances: defineTable({
    fromChurchId: v.id("churches"),
    toChurchId: v.id("churches"),
    travelMins: v.number(),
  }).index("by_from", ["fromChurchId"]),

  // --- CLERGY ---
  clergy: defineTable({
    parishId: v.id("parishes"),
    userId: v.optional(v.id("users")),
    name: v.string(),
    email: v.optional(v.string()),
    type: v.union(
      v.literal("bishop"),
      v.literal("priest"),
      v.literal("deacon"),
      v.literal("religious"),
      v.literal("sister"),
    ),
    roles: v.array(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("pending"),
    ),
    inviteToken: v.optional(v.string()),
  })
    .index("by_parish", ["parishId"])
    .index("by_user", ["userId"])
    .index("by_invite_token", ["inviteToken"]),

  // --- AVAILABILITY ---
  availability: defineTable({
    clergyId: v.id("clergy"),
    parishId: v.id("parishes"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
  }).index("by_clergy", ["clergyId"]),

  // --- TIME OFF ---
  timeOff: defineTable({
    clergyId: v.id("clergy"),
    parishId: v.id("parishes"),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    reviewedBy: v.optional(v.id("clergy")),
  }).index("by_clergy", ["clergyId"]),

  // --- ACTIVITIES ---
  activities: defineTable({
    parishId: v.id("parishes"),
    churchId: v.id("churches"),
    type: v.union(
      v.literal("mass"),
      v.literal("confessions"),
      v.literal("exposition"),
      v.literal("evening_prayer"),
      v.literal("baptism"),
      v.literal("vespers"),
      v.literal("other"),
    ),
    name: v.optional(v.string()),
    schedule: v.union(
      v.literal("weekday"),
      v.literal("saturday"),
      v.literal("sunday"),
      v.literal("vigil"),
      v.literal("specific"),
    ),
    time: v.string(),
    specificDate: v.optional(v.number()),
    isVigil: v.boolean(),
    liturgicalColour: v.optional(v.union(
      v.literal("white"),
      v.literal("red"),
      v.literal("green"),
      v.literal("purple"),
      v.literal("rose"),
      v.literal("marian_white"),
      v.literal("black"),
    )),
    requiredClergyCount: v.number(),
    requiredRoles: v.array(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_parish", ["parishId"])
    .index("by_church", ["churchId"])
    .index("by_parish_schedule", ["parishId", "schedule"]),

  // --- ROTAS ---
  rotas: defineTable({
    parishId: v.id("parishes"),
    startDate: v.string(),
    endDate: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
    ),
    generatedBy: v.union(
      v.literal("auto"),
      v.literal("manual"),
    ),
    createdBy: v.id("users"),
    publishedAt: v.optional(v.number()),
  }).index("by_parish", ["parishId"]),

  // --- ASSIGNMENTS ---
  assignments: defineTable({
    rotaId: v.id("rotas"),
    parishId: v.id("parishes"),
    activityId: v.id("activities"),
    clergyId: v.id("clergy"),
    date: v.string(),
    status: v.union(
      v.literal("assigned"),
      v.literal("confirmed"),
      v.literal("declined"),
    ),
    overrideNote: v.optional(v.string()),
    hasViolation: v.boolean(),
    violationDetail: v.optional(v.string()),
  })
    .index("by_rota", ["rotaId"])
    .index("by_clergy", ["clergyId"])
    .index("by_date", ["date"]),

  // --- RULES ---
  rules: defineTable({
    parishId: v.id("parishes"),
    label: v.string(),
    type: v.union(
      v.literal("hard"),
      v.literal("soft"),
    ),
    constraint: v.string(),
    parsedRule: v.optional(v.any()),
    enabled: v.boolean(),
    createdBy: v.id("users"),
  }).index("by_parish", ["parishId"]),

  // --- ROTA SHARES ---
  rotaShares: defineTable({
    rotaId: v.id("rotas"),
    token: v.string(),
    expiresAt: v.optional(v.number()),
    createdBy: v.id("users"),
  }).index("by_token", ["token"]),

  // --- LITURGICAL CACHE ---
  liturgicalCache: defineTable({
    year: v.number(),
    locale: v.string(),
    data: v.any(),
  }).index("by_year_locale", ["year", "locale"]),

});