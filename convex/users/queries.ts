import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { authQuery } from "../helpers";

export const getCurrentUserId = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", identity.subject))
			.unique();

		return user?._id ?? null;
	},
});

export const getUserByAuthId = query({
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
		return await ctx.db.get(args.userId);
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
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.unique();
	},
});
