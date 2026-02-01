import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { mutation, query } from "./_generated/server";

// Custom query that adds authenticated user to context
export const authQuery = customQuery(query, {
	args: {},
	input: async (ctx, _args) => {
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
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", identity.subject))
			.unique();

		if (!user) {
			throw new Error("User not found in database");
		}

		return {
			ctx: { user },
			args: {},
		};
	},
});
