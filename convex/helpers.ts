import {
	zCustomAction,
	zCustomMutation,
	zCustomQuery,
} from "convex-helpers/server/zod4";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { action, mutation, query } from "./_generated/server";
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

// Custom query that adds authenticated user to context (Zod args per function)
export const authQuery = zCustomQuery(query, {
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

// Custom mutation that adds authenticated user to context (Zod args per function)
export const authMutation = zCustomMutation(mutation, {
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

// Custom action that adds authenticated user to context (Zod args per function; uses runQuery for user lookup)
export const authAction = zCustomAction(action, {
	args: {},
	input: async (ctx, _args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throwConvexError(ErrorCode.NOT_AUTHENTICATED, "Not authenticated");
		}
		const user = (await ctx.runQuery(internal.users.queries.getUserByAuthId, {
			authId: identity.subject,
		})) as Doc<"users"> | null;

		if (!user) {
			throwConvexError(ErrorCode.USER_NOT_FOUND, "User not found in database");
		}
		return {
			ctx: { user },
			args: {},
		};
	},
});
