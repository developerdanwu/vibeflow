import { v } from "convex/values";
import { authMutation } from "../helpers";
import { ErrorCode, throwConvexError } from "../errors";

export const linkTaskToEvent = authMutation({
	args: {
		eventId: v.id("events"),
		externalTaskId: v.string(),
		url: v.string(),
		linkType: v.optional(v.union(v.literal("scheduled"), v.literal("related"))),
	},
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
			});
			}
			return existing._id;
		}

		return await ctx.db.insert("eventTaskLinks", {
			eventId: args.eventId,
			externalTaskId: args.externalTaskId,
			provider: "linear",
			url: args.url,
			linkType: effectiveLinkType,
		});
	},
});

export const unlinkTaskFromEvent = authMutation({
	args: {
		eventId: v.id("events"),
		externalTaskId: v.string(),
	},
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
