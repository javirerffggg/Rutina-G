import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getSyncState = query({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userState")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .first();
  },
});

export const resolveDevice = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    // Try by exact device ID
    const byId = await ctx.db
      .query("userState")
      .withIndex("by_device", (q) => q.eq("deviceId", args.identifier))
      .first();
    if (byId) return byId.deviceId;

    // Try by username (case sensitive first, but users should match exact)
    const byUsername = await ctx.db
      .query("userState")
      .withIndex("by_username", (q) => q.eq("username", args.identifier))
      .first();
    if (byUsername) return byUsername.deviceId;

    return null;
  },
});

export const pushSyncState = mutation({
  args: {
    deviceId: v.string(),
    logs: v.string(),
    achievements: v.string(),
    routines: v.optional(v.string()),
    settings: v.optional(v.string()),
    rpgLevel: v.optional(v.string()),
    rpgXp: v.optional(v.number()),
    username: v.optional(v.string()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userState")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .first();
      
    if (existing) {
      if (args.updatedAt > existing.updatedAt) {
        await ctx.db.patch(existing._id, {
          logs: args.logs,
          achievements: args.achievements,
          routines: args.routines,
          settings: args.settings,
          rpgLevel: args.rpgLevel,
          rpgXp: args.rpgXp,
          username: args.username,
          updatedAt: args.updatedAt,
        });
      }
    } else {
      await ctx.db.insert("userState", {
        deviceId: args.deviceId,
        logs: args.logs,
        achievements: args.achievements,
        routines: args.routines,
        settings: args.settings,
        rpgLevel: args.rpgLevel,
        rpgXp: args.rpgXp,
        username: args.username,
        updatedAt: args.updatedAt,
      });
    }

    // Schedule GitHub sync in background
    await ctx.scheduler.runAfter(0, api.github.syncToGithub, { 
      deviceId: args.deviceId 
    });
  },
});
