import { z } from "zod";
import { zid } from "convex-helpers/server/zod4";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internalMutation } from "../_generated/server";
import { ErrorCode, throwConvexError } from "../errors";
import { authMutation } from "../helpers";
import { workflow } from "../workflow";

const syncCalendarWorkflowArgs = {
	connectionId: v.id("calendarConnections"),
	externalCalendarId: v.string(),
};

const syncWorkflowContextValidator = v.object({
	connectionId: v.id("calendarConnections"),
	externalCalendarId: v.string(),
});

/** Result from workflow onComplete (workpool vResultValidator); we only read kind and error. */
const workflowResultValidator = v.any();

/**
 * Durable workflow: runs the full Google Calendar sync for one calendar.
 * Keeps workflow state small (no event payloads in state); run ID is set when starting.
 */
export const syncCalendarWorkflow = workflow.define({
	args: syncCalendarWorkflowArgs,
	handler: async (step, args): Promise<void> => {
		await step.runAction(internal.googleCalendar.actionsNode.syncCalendar, {
			connectionId: args.connectionId,
			externalCalendarId: args.externalCalendarId,
		});
	},
});

/** Auth: start sync workflow for one calendar and set latestSyncWorkflowRunId (for FE / user-triggered sync). */
export const startSyncWorkflow = authMutation({
	args: z.object({
		connectionId: zid("calendarConnections"),
		externalCalendarId: z.string(),
	}),
	handler: async (ctx, args) => {
		await ensureCalendarOwnership(ctx, args.connectionId, args.externalCalendarId);
		const context = {
			connectionId: args.connectionId,
			externalCalendarId: args.externalCalendarId,
		};
		const workflowId = await workflow.start(
			ctx,
			internal.googleCalendar.syncWorkflow.syncCalendarWorkflow,
			context,
			{
				startAsync: true,
				onComplete: internal.googleCalendar.syncWorkflow.handleSyncWorkflowOnComplete,
				context,
			},
		);
		await ctx.runMutation(
			internal.googleCalendar.mutations.setLatestSyncWorkflowRunId,
			{
				connectionId: args.connectionId,
				externalCalendarId: args.externalCalendarId,
				workflowRunId: workflowId,
			},
		);
	},
});

/** Internal: start sync workflow and set latestSyncWorkflowRunId (for syncMyCalendars, webhook, cron). */
export const startSyncWorkflowInternal = internalMutation({
	args: syncCalendarWorkflowArgs,
	handler: async (ctx, args) => {
		const context = {
			connectionId: args.connectionId,
			externalCalendarId: args.externalCalendarId,
		};
		const workflowId = await workflow.start(
			ctx,
			internal.googleCalendar.syncWorkflow.syncCalendarWorkflow,
			context,
			{
				startAsync: true,
				onComplete: internal.googleCalendar.syncWorkflow.handleSyncWorkflowOnComplete,
				context,
			},
		);
		await ctx.runMutation(
			internal.googleCalendar.mutations.setLatestSyncWorkflowRunId,
			{
				connectionId: args.connectionId,
				externalCalendarId: args.externalCalendarId,
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
		const ext = await ctx.db
			.query("externalCalendars")
			.withIndex("by_connection_and_external_id", (q) =>
				q
					.eq("connectionId", args.context.connectionId)
					.eq("externalCalendarId", args.context.externalCalendarId),
			)
			.unique();
		if (ext) {
			await ctx.db.patch("externalCalendars", ext._id, {
				lastSyncErrorMessage: message,
			});
		}
	},
});

async function ensureCalendarOwnership(
	ctx: MutationCtx & { user: Doc<"users"> },
	connectionId: Doc<"calendarConnections">["_id"],
	externalCalendarId: string,
) {
	const connection = await ctx.db.get(
		"calendarConnections",
		connectionId,
	);
	if (!connection || connection.userId !== ctx.user._id) {
		throwConvexError(
			ErrorCode.CONNECTION_NOT_FOUND,
			"Connection not found or not owned by you",
		);
	}
	const ext = await ctx.db
		.query("externalCalendars")
		.withIndex("by_connection_and_external_id", (q) =>
			q.eq("connectionId", connectionId).eq("externalCalendarId", externalCalendarId),
		)
		.unique();
	if (!ext) {
		throwConvexError(ErrorCode.CONNECTION_NOT_FOUND, "External calendar not found");
	}
}
