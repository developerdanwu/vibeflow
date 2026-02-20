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
		const event = await ctx.db.get("events", eventId);
		if (!event) {
			return [];
		}
		if (event.userId !== ctx.user._id) {
			throwConvexError(
				ErrorCode.NOT_AUTHORIZED,
				"Not authorized to view this event",
			);
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

export const getScheduledLinksByEventId = authQuery({
	args: {
		eventId: v.optional(v.id("events")),
	},
	handler: async (ctx, args) => {
		if (args.eventId === undefined) {
			return [];
		}
		const eventId = args.eventId;
		const event = await ctx.db.get("events", eventId);
		if (!event) {
			return [];
		}
		if (event.userId !== ctx.user._id) {
			throwConvexError(
				ErrorCode.NOT_AUTHORIZED,
				"Not authorized to view this event",
			);
		}

		const links = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_event", (q) => q.eq("eventId", eventId))
			.collect();

		return links
			.filter((l) => l.linkType === "scheduled")
			.map((l) => ({ externalTaskId: l.externalTaskId, url: l.url }));
	},
});
