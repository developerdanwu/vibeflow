import { v } from "convex/values";
import { authQuery } from "../helpers";

export const getLinksByEventId = authQuery({
	args: {
		eventId: v.id("events"),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.eventId);
		if (!event) {
			return [];
		}
		if (event.userId !== ctx.user._id) {
			throw new Error("Not authorized to view this event");
		}

		const links = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();

		return links.map((link) => ({
			externalTaskId: link.externalTaskId,
			url: link.url,
		}));
	},
});
