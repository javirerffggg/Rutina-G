import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userState: defineTable({
    deviceId: v.string(),
    logs: v.string(),
    achievements: v.string(),
    updatedAt: v.number(),
  }).index("by_device", ["deviceId"]),
});
