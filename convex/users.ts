import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { internalQuery, mutation, query } from "./_generated/server";

// Helper for mutations (internal use)
export async function getUserIdFromAuth(ctx: MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("authId", (q) => q.eq("authId", identity.subject))
		.unique();

	if (!user) {
		throw new Error("User not found in database");
	}

	return user._id;
}

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


