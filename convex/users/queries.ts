import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { authQuery } from "../helpers";
import { Doc } from "../_generated/dataModel";

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

const userDocValidator = v.object({
	_id: v.id("users"),
	authId: v.string(),
	email: v.string(),
	firstName: v.optional(v.string()),
	lastName: v.optional(v.string()),
	fullName: v.string(),
	profileImageUrl: v.optional(v.string()),
	updatedAt: v.number(),
});

export const getUserByAuthId = query({
	args: { authId: v.string() },
	returns: v.union(userDocValidator, v.null()),
	handler: async (ctx, args): Promise<Doc<"users"> | null> => {
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
