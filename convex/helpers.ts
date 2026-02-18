import {
	customAction,
	customMutation,
	customQuery,
} from "convex-helpers/server/customFunctions";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { ErrorCode, throwConvexError } from "./errors";

/** Helper for mutations: get current user id from auth (internal use). */
export async function getUserIdFromAuth(ctx: MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throwConvexError(ErrorCode.NOT_AUTHENTICATED, "Not authenticated");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("authId", (q) => q.eq("authId", identity.subject))
		.unique();

	if (!user) {
		throwConvexError(ErrorCode.USER_NOT_FOUND, "User not found in database");
	}

	return user._id;
}

// Custom query that adds authenticated user to context
export const authQuery = customQuery(query, {
	args: {},
	input: async (ctx, _args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throwConvexError(ErrorCode.NOT_AUTHENTICATED, "Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", identity.subject))
			.unique();

		if (!user) {
			throwConvexError(ErrorCode.USER_NOT_FOUND, "User not found in database");
		}

		return {
			ctx: { user },
			args: {},
		};
	},
});

// Custom mutation that adds authenticated user to context
export const authMutation = customMutation(mutation, {
	args: {},
	input: async (ctx, _args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throwConvexError(ErrorCode.NOT_AUTHENTICATED, "Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", identity.subject))
			.unique();

		if (!user) {
			throwConvexError(ErrorCode.USER_NOT_FOUND, "User not found in database");
		}

		return {
			ctx: { user },
			args: {},
		};
	},
});

// Custom action that adds authenticated user to context (uses runQuery for user lookup)
export const authAction = customAction(action, {
	args: {},
	input: async (ctx, _args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throwConvexError(ErrorCode.NOT_AUTHENTICATED, "Not authenticated");
		}
		const user = (await ctx.runQuery(
			api.users.queries
				.getUserByAuthId as import("convex/server").FunctionReference<
				"query",
				"public",
				{ authId: string },
				Doc<"users"> | null
			>,
			{ authId: identity.subject },
		)) as Doc<"users"> | null;
		if (!user) {
			throwConvexError(ErrorCode.USER_NOT_FOUND, "User not found in database");
		}
		return {
			ctx: { user },
			args: {},
		};
	},
});
