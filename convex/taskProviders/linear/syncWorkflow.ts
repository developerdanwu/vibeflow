import { z } from "zod";
import { zid } from "convex-helpers/server/zod4";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import type { Doc } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { internalMutation } from "../../_generated/server";
import { ErrorCode, throwConvexError } from "../../errors";
import { authMutation } from "../../helpers";
import { workflow } from "../../workflow";

const syncWorkflowArgs = {
	connectionId: v.id("taskConnections"),
};

const syncWorkflowContextValidator = v.object({
	connectionId: v.id("taskConnections"),
});

/** Result from workflow onComplete; we only read kind and error. */
const workflowResultValidator = v.any();

/**
 * Durable workflow: runs Linear issues sync for one connection.
 * Run ID is set when starting; status via getMyLinearConnection + getLinearSyncWorkflowStatus.
 */
export const syncLinearIssuesWorkflow = workflow.define({
	args: syncWorkflowArgs,
	handler: async (step, args): Promise<void> => {
		await step.runAction(
			internal.taskProviders.linear.actionsNode.syncLinearIssues,
			{ connectionId: args.connectionId },
		);
	},
});

/** Auth: start Linear sync workflow and set latestSyncWorkflowRunId. */
export const startSyncWorkflow = authMutation({
	args: z.object({
		connectionId: zid("taskConnections"),
	}),
	handler: async (ctx, args) => {
		await ensureConnectionOwnership(ctx, args.connectionId);
		const context = { connectionId: args.connectionId };
		const workflowId = await workflow.start(
			ctx,
			internal.taskProviders.linear.syncWorkflow.syncLinearIssuesWorkflow,
			context,
			{
				startAsync: true,
				onComplete:
					internal.taskProviders.linear.syncWorkflow.handleSyncWorkflowOnComplete,
				context,
			},
		);
		await ctx.runMutation(
			internal.taskProviders.linear.mutations.setLatestSyncWorkflowRunId,
			{
				connectionId: args.connectionId,
				workflowRunId: workflowId,
			},
		);
	},
});

/** Internal: start sync workflow and set latestSyncWorkflowRunId (for fetchMyIssues, cron). */
export const startSyncWorkflowInternal = internalMutation({
	args: syncWorkflowArgs,
	handler: async (ctx, args) => {
		const context = { connectionId: args.connectionId };
		const workflowId = await workflow.start(
			ctx,
			internal.taskProviders.linear.syncWorkflow.syncLinearIssuesWorkflow,
			context,
			{
				startAsync: true,
				onComplete:
					internal.taskProviders.linear.syncWorkflow.handleSyncWorkflowOnComplete,
				context,
			},
		);
		await ctx.runMutation(
			internal.taskProviders.linear.mutations.setLatestSyncWorkflowRunId,
			{
				connectionId: args.connectionId,
				workflowRunId: workflowId,
			},
		);
	},
});

/** Internal: onComplete for sync workflow; sets lastSyncErrorMessage when run failed. */
export const handleSyncWorkflowOnComplete = internalMutation({
	args: {
		workflowId: v.string(),
		result: workflowResultValidator,
		context: syncWorkflowContextValidator,
	},
	handler: async (ctx, args) => {
		const result = args.result as { kind: string; error?: string };
		if (result.kind !== "failed" && result.kind !== "error") return;
		const message = result.error ?? "Sync failed";
		const conn = await ctx.db.get(
			"taskConnections",
			args.context.connectionId,
		);
		if (conn) {
			await ctx.db.patch("taskConnections", args.context.connectionId, {
				lastSyncErrorMessage: message,
			});
		}
	},
});

async function ensureConnectionOwnership(
	ctx: MutationCtx & { user: Doc<"users"> },
	connectionId: Doc<"taskConnections">["_id"],
) {
	const connection = await ctx.db.get("taskConnections", connectionId);
	if (!connection || connection.userId !== ctx.user._id) {
		throwConvexError(
			ErrorCode.LINEAR_CONNECTION_NOT_FOUND,
			"Connection not found or not owned by you",
		);
	}
}
