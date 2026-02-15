import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { authMutation } from "../helpers";

const calendarSyncFromMonthsValidator = v.optional(
	v.union(
		v.literal(1),
		v.literal(3),
		v.literal(6),
		v.literal(12),
		v.literal(24),
	),
);

export const ensureUserExists = mutation({
	args: {
		authId: v.string(),
		email: v.string(),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		profileImageUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existingUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();

		if (existingUser) {
			return existingUser;
		}

		try {
			const userId = await ctx.db.insert("users", {
				authId: args.authId,
				email: args.email,
				firstName: args.firstName,
				lastName: args.lastName,
				fullName:
					`${args.firstName ?? ""} ${args.lastName ?? ""}`.trim() || args.email,
				profileImageUrl: args.profileImageUrl,
				updatedAt: Date.now(),
			});
			return await ctx.db.get(userId);
		} catch (error) {
			console.log(`Concurrent user creation for: ${args.authId}`, error);
			return await ctx.db
				.query("users")
				.withIndex("authId", (q) => q.eq("authId", args.authId))
				.unique();
		}
	},
});

/** Update current user's preferences (e.g. calendar sync range). */
export const updateUserPreferences = authMutation({
	args: {
		calendarSyncFromMonths: calendarSyncFromMonthsValidator,
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.unique();
		const value = args.calendarSyncFromMonths;
		if (existing) {
			if (value === undefined) {
				return;
			}
			await ctx.db.patch(existing._id, { calendarSyncFromMonths: value });
			return;
		}
		if (value === undefined) {
			return;
		}
		await ctx.db.insert("userPreferences", {
			userId: ctx.user._id,
			calendarSyncFromMonths: value,
		});
	},
});
