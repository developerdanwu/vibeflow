import { z } from "zod";
import { zid } from "convex-helpers/server/zod4";
import { authMutation } from "../helpers";
import { ErrorCode, throwConvexError } from "../errors";

export const linkTaskToEvent = authMutation({
	args: z.object({
		eventId: zid("events"),
		externalTaskId: z.string(),
		url: z.string(),
		linkType: z.enum(["scheduled", "related"]).optional(),
	}),
	handler: async (ctx, args) => {
		const event = await ctx.db.get("events", args.eventId);
		if (!event) {
			throwConvexError(ErrorCode.EVENT_NOT_FOUND, "Event not found");
		}
		if (event.userId !== ctx.user._id) {
			throwConvexError(
				ErrorCode.NOT_AUTHORIZED,
				"Not authorized to link task to this event",
			);
		}

		const effectiveLinkType = args.linkType ?? "related";

		const existing = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_event_and_external_task", (q) =>
				q.eq("eventId", args.eventId).eq("externalTaskId", args.externalTaskId),
			)
			.unique();

		if (existing) {
			if (effectiveLinkType !== existing.linkType) {
				await ctx.db.patch("eventTaskLinks", existing._id, {
					linkType: effectiveLinkType,
					userId: event.userId,
				});
			} else if (existing.userId === undefined) {
				await ctx.db.patch("eventTaskLinks", existing._id, {
					userId: event.userId,
				});
			}
			return existing._id;
		}

		return await ctx.db.insert("eventTaskLinks", {
			eventId: args.eventId,
			userId: event.userId,
			externalTaskId: args.externalTaskId,
			provider: "linear",
			url: args.url,
			linkType: effectiveLinkType,
		});
	},
});

export const unlinkTaskFromEvent = authMutation({
	args: z.object({
		eventId: zid("events"),
		externalTaskId: z.string(),
	}),
	handler: async (ctx, args) => {
		const event = await ctx.db.get("events", args.eventId);
		if (!event) {
			throwConvexError(ErrorCode.EVENT_NOT_FOUND, "Event not found");
		}
		if (event.userId !== ctx.user._id) {
			throwConvexError(
				ErrorCode.NOT_AUTHORIZED,
				"Not authorized to unlink task from this event",
			);
		}

		const link = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_event_and_external_task", (q) =>
				q.eq("eventId", args.eventId).eq("externalTaskId", args.externalTaskId),
			)
			.unique();

		if (link) {
			await ctx.db.delete("eventTaskLinks", link._id);
		}
	},
});
