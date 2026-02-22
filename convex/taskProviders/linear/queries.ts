import type { WorkflowId } from "@convex-dev/workflow";
import { v } from "convex/values";
import { z } from "zod";
import { internalQuery } from "../../_generated/server";
import { authQuery } from "../../helpers";
import { workflow } from "../../workflow";

/** Internal: get all Linear connections for a user (for actions that sync all workspaces). */
export const getConnectionsByUserId = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("taskConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", args.userId).eq("provider", "linear"),
			)
			.collect();
	},
});

/** Internal: get connection by id (for getLinearClient in actions). */
export const getConnectionById = internalQuery({
	args: { connectionId: v.id("taskConnections") },
	handler: async (ctx, args) => {
		return await ctx.db.get("taskConnections", args.connectionId);
	},
});

/** Auth: get current user's Linear connections (no tokens). One per workspace. */
export const getMyLinearConnections = authQuery({
	args: z.object({}),
	handler: async (ctx) => {
		const connections = await ctx.db
			.query("taskConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", ctx.user._id).eq("provider", "linear"),
			)
			.collect();
		return connections.map((c) => ({
			connectionId: c._id,
			providerMetadata: c.providerMetadata,
			latestSyncWorkflowRunId: c.latestSyncWorkflowRunId,
			lastSyncErrorMessage: c.lastSyncErrorMessage,
		}));
	},
});

/** Auth: get sync workflow run status (only for current user's Linear connection run). Safe for multiple Linear connections: workflowId is unique per run so at most one connection matches. */
export const getLinearSyncWorkflowStatus = authQuery({
	args: z.object({ workflowId: z.string() }),
	handler: async (ctx, args) => {
		const conn = await ctx.db
			.query("taskConnections")
			.withIndex("by_latestSyncWorkflowRunId", (q) =>
				q.eq("latestSyncWorkflowRunId", args.workflowId),
			)
			.first();
		if (!conn || conn.userId !== ctx.user._id) {
			return null;
		}
		return await workflow.status(ctx, args.workflowId as WorkflowId);
	},
});

/** Auth: get cached task items for the current user (Linear issues). */
export const getMyTaskItems = authQuery({
	args: z.object({}),
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
