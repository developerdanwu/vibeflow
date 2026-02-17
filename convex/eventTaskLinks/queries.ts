import { v } from "convex/values";
import { authQuery } from "../helpers";
import { ErrorCode, throwConvexError } from "../errors";

export const getLinksByEventId = authQuery({
	args: {
		eventId: v.optional(v.id("events")),
	},
	handler: async (ctx, args) => {
		if (args.eventId === undefined) {
			return [];
		}
		const eventId = args.eventId;
		const event = await ctx.db.get(eventId);
		if (!event) {
			return [];
		}
		if (event.userId !== ctx.user._id) {
			throwConvexError(ErrorCode.NOT_AUTHORIZED, "Not authorized to view this event");
		}

		const links = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_event", (q) => q.eq("eventId", eventId))
			.collect();

		return links.map((link) => ({
			externalTaskId: link.externalTaskId,
			url: link.url,
			linkType: link.linkType,
		}));
	},
});

export const getScheduledLinkByEventId = authQuery({
	args: {
		eventId: v.optional(v.id("events")),
	},
	handler: async (ctx, args) => {
		if (args.eventId === undefined) {
			return null;
		}
		const eventId = args.eventId;
		const event = await ctx.db.get(eventId);
		if (!event) {
			return null;
		}
		if (event.userId !== ctx.user._id) {
			throwConvexError(ErrorCode.NOT_AUTHORIZED, "Not authorized to view this event");
		}

		const links = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_event", (q) => q.eq("eventId", eventId))
			.collect();

		const scheduled = links.find((l) => l.linkType === "scheduled");
		if (scheduled) {
			return {
				externalTaskId: scheduled.externalTaskId,
				url: scheduled.url,
			};
		}
		return null;
	},
});
