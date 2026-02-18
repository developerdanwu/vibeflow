import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { authQuery } from "../../helpers";

/** Internal: get connection with tokens for actions (e.g. token refresh, API calls). */
export const getConnectionByUserId = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("taskConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", args.userId).eq("provider", "linear"),
			)
			.unique();
	},
});

/** Internal: get connection by id (for getLinearClient in actions). */
export const getConnectionById = internalQuery({
	args: { connectionId: v.id("taskConnections") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.connectionId);
	},
});

/** Auth: get current user's Linear connection status (no tokens). */
export const getMyLinearConnection = authQuery({
	args: {},
	handler: async (ctx) => {
		const connection = await ctx.db
			.query("taskConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", ctx.user._id).eq("provider", "linear"),
			)
			.unique();
		if (!connection) return null;
		return {
			connectionId: connection._id,
			providerMetadata: connection.providerMetadata,
		};
	},
});

/** Auth: get cached task items for the current user (Linear issues). */
export const getMyTaskItems = authQuery({
	args: {},
	handler: async (ctx) => {
		const items = await ctx.db
			.query("taskItems")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", ctx.user._id).eq("provider", "linear"),
			)
			.collect();
		return items.sort((a, b) => {
			const pA = a.priority ?? 0;
			const pB = b.priority ?? 0;
			if (pB !== pA) return pA - pB;
			const dA = a.dueDate ?? "";
			const dB = b.dueDate ?? "";
			return dA.localeCompare(dB);
		});
	},
});
