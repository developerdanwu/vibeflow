import { v } from "convex/values";
import { z } from "zod";
import { mutation } from "../_generated/server";
import { ErrorCode, throwConvexError } from "../errors";
import { authMutation } from "../helpers";

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

		const user = await ctx.db.get("users", userId);

		if (!user) {
			throwConvexError(ErrorCode.USER_NOT_FOUND, "User not found");
		}

		return user;
	},
});

/** Update current user's preferences (e.g. calendar sync range). */
export const updateUserPreferences = authMutation({
	args: z.object({
		calendarSyncFromMonths: z
			.union([
				z.literal(1),
				z.literal(3),
				z.literal(6),
				z.literal(12),
				z.literal(24),
			])
			.optional(),
	}),
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
			await ctx.db.patch("userPreferences", existing._id, {
				calendarSyncFromMonths: value,
			});
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
