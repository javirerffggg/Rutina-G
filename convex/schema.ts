import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userState: defineTable({
    deviceId: v.string(),
    logs: v.string(),
    achievements: v.string(),
    routines: v.optional(v.string()),
    settings: v.optional(v.string()),
    rpgLevel: v.optional(v.string()),
    rpgXp: v.optional(v.number()),
    username: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_device", ["deviceId"]).index("by_username", ["username"]),
});
