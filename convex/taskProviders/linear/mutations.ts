import { v } from "convex/values";
import { z } from "zod";
import { internalMutation } from "../../_generated/server";
import { ErrorCode, throwConvexError } from "../../errors";
import { authMutation } from "../../helpers";

const connectionTokensValidator = {
	accessToken: v.string(),
	refreshToken: v.optional(v.string()),
	accessTokenExpiresAt: v.optional(v.number()),
};

/** Internal: save new connection after OAuth exchange. */
export const saveConnection = internalMutation({
	args: {
		userId: v.id("users"),
		...connectionTokensValidator,
		providerMetadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get("users", args.userId);
		if (!user) {
			throwConvexError(ErrorCode.USER_NOT_FOUND, "User not found");
		}
		const now = Date.now();
		const existing = await ctx.db
			.query("taskConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", args.userId).eq("provider", "linear"),
			)
			.unique();
		if (existing) {
			await ctx.db.patch("taskConnections", existing._id, {
				accessToken: args.accessToken,
				refreshToken: args.refreshToken,
				accessTokenExpiresAt: args.accessTokenExpiresAt,
				providerMetadata: args.providerMetadata,
				updatedAt: now,
			});
			return existing._id;
		}
		return await ctx.db.insert("taskConnections", {
			userId: args.userId,
			provider: "linear",
			accessToken: args.accessToken,
			refreshToken: args.refreshToken,
			accessTokenExpiresAt: args.accessTokenExpiresAt,
			providerMetadata: args.providerMetadata,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/** Internal: update access token after refresh. */
export const updateConnectionTokens = internalMutation({
	args: {
		connectionId: v.id("taskConnections"),
		accessToken: v.string(),
		refreshToken: v.optional(v.string()),
		accessTokenExpiresAt: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch("taskConnections", args.connectionId, {
			accessToken: args.accessToken,
			...(args.refreshToken !== undefined && {
				refreshToken: args.refreshToken,
			}),
			accessTokenExpiresAt: args.accessTokenExpiresAt,
			updatedAt: Date.now(),
		});
	},
});

/** Internal: set latest sync workflow run id (and clear last error) when starting a sync. */
export const setLatestSyncWorkflowRunId = internalMutation({
	args: {
		connectionId: v.id("taskConnections"),
		workflowRunId: v.string(),
	},
	handler: async (ctx, args) => {
		const conn = await ctx.db.get("taskConnections", args.connectionId);
		if (conn) {
			await ctx.db.patch("taskConnections", args.connectionId, {
				latestSyncWorkflowRunId: args.workflowRunId,
				lastSyncErrorMessage: undefined,
			});
		}
	},
});

/** Internal: delete task connection (disconnect). */
export const removeConnection = internalMutation({
	args: {
		connectionId: v.id("taskConnections"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete("taskConnections", args.connectionId);
	},
});

const taskItemValidator = {
	externalTaskId: v.string(),
	title: v.string(),
	identifier: v.optional(v.string()),
	state: v.optional(v.string()),
	priority: v.optional(v.number()),
	dueDate: v.optional(v.string()),
	projectName: v.optional(v.string()),
	projectId: v.optional(v.string()),
	url: v.string(),
};

/** Internal: upsert task items from a fetch (replace cache for this user+provider). */
export const upsertTaskItems = internalMutation({
	args: {
		userId: v.id("users"),
		connectionId: v.id("taskConnections"),
		items: v.array(v.object(taskItemValidator)),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const seenIds = new Set<string>();
		for (const item of args.items) {
			seenIds.add(item.externalTaskId);
			const existing = await ctx.db
				.query("taskItems")
				.withIndex("by_external_task", (q) =>
					q.eq("provider", "linear").eq("externalTaskId", item.externalTaskId),
				)
				.unique();
			const doc = {
				userId: args.userId,
				connectionId: args.connectionId,
				provider: "linear" as const,
				externalTaskId: item.externalTaskId,
				title: item.title,
				identifier: item.identifier,
				state: item.state,
				priority: item.priority,
				dueDate: item.dueDate,
				projectName: item.projectName,
				projectId: item.projectId,
				url: item.url,
				updatedAt: now,
			};
			if (existing) {
				await ctx.db.patch("taskItems", existing._id, doc);
			} else {
				await ctx.db.insert("taskItems", doc);
			}
		}
		// Remove cached items that are no longer in the fetched list
		const allForConnection = await ctx.db
			.query("taskItems")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", args.userId).eq("provider", "linear"),
			)
			.collect();
		for (const row of allForConnection) {
			if (!seenIds.has(row.externalTaskId)) {
				await ctx.db.delete("taskItems", row._id);
			}
		}
	},
});

/** Auth: disconnect current user's Linear connection (and delete cached task items). */
export const removeMyLinearConnection = authMutation({
	args: z.object({}),
	handler: async (ctx) => {
		const connection = await ctx.db
			.query("taskConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", ctx.user._id).eq("provider", "linear"),
			)
			.unique();
		if (!connection) return;
		// Delete cached task items for this connection
		const items = await ctx.db
			.query("taskItems")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", ctx.user._id).eq("provider", "linear"),
			)
			.collect();
		for (const item of items) {
			await ctx.db.delete("taskItems", item._id);
		}
		await ctx.db.delete("taskConnections", connection._id);
	},
});
