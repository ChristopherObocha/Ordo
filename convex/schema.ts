import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clergy: defineTable({
    name: v.string(),
    type: v.string(), // bishop, priest, deacon etc
  }),
});