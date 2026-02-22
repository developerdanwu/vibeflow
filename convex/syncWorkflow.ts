import { z } from "zod";
import { internal } from "./_generated/api";
import { ErrorCode, throwConvexError } from "./errors";
import { authMutation } from "./helpers";
import { workflow } from "./workflow";

/** Auth: start all sync workflows for the current user (Google calendars + Linear tasks). Single mutation for "Sync now" button. */
export const startAllSyncs = authMutation({
	args: z.object({}),
	handler: async (ctx) => {
		const googleConnection = await ctx.db
			.query("calendarConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", ctx.user._id).eq("provider", "google"),
			)
			.unique();
		if (googleConnection) {
			const externalCalendars = await ctx.db
				.query("externalCalendars")
				.withIndex("by_connection", (q) =>
					q.eq("connectionId", googleConnection._id),
				)
				.collect();
			for (const ext of externalCalendars) {
				const context = {
					connectionId: googleConnection._id,
					externalCalendarId: ext.externalCalendarId,
				};
				const workflowId = await workflow.start(
					ctx,
					internal.googleCalendar.syncWorkflow.syncCalendarWorkflow,
					context,
					{
						startAsync: true,
						onComplete:
							internal.googleCalendar.syncWorkflow.handleSyncWorkflowOnComplete,
						context,
					},
				);
				await ctx.db.patch("externalCalendars", ext._id, {
					latestSyncWorkflowRunId: workflowId,
					lastSyncErrorMessage: undefined,
				});
			}
		}

		const linearConnection = await ctx.db
			.query("taskConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", ctx.user._id).eq("provider", "linear"),
			)
			.unique();
		if (linearConnection) {
			const context = { connectionId: linearConnection._id };
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
			await ctx.db.patch("taskConnections", linearConnection._id, {
				latestSyncWorkflowRunId: workflowId,
				lastSyncErrorMessage: undefined,
			});
		}

		if (!googleConnection && !linearConnection) {
			throwConvexError(
				ErrorCode.CONNECTION_NOT_FOUND,
				"No calendar or task connection to sync",
			);
		}
	},
});
