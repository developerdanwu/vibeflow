import { v } from "convex/values";
import { z } from "zod";
import { internalQuery } from "../_generated/server";
import { authQuery } from "../helpers";

/** Internal: for authAction only. Do not expose as a public API. */
export const getUserByAuthId = internalQuery({
	args: { authId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();
	},
});

/** Internal: get user by id for sync operations. */
export const getUserById = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db.get("users", args.userId);
	},
});

/** Internal: get user preferences by user id (for sync). */
export const getUserPreferencesByUserId = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
	},
});

/** Get current user's preferences (for settings UI). */
export const getUserPreferences = authQuery({
	args: z.object({}),
	handler: async (ctx) => {
		return await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.unique();
	},
});
