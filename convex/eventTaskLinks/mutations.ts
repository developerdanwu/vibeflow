import { v } from "convex/values";
import { authMutation } from "../helpers";

export const linkTaskToEvent = authMutation({
	args: {
		eventId: v.id("events"),
		externalTaskId: v.string(),
		url: v.string(),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}
		if (event.userId !== ctx.user._id) {
			throw new Error("Not authorized to link task to this event");
		}

		const existing = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_event_and_external_task", (q) =>
				q.eq("eventId", args.eventId).eq("externalTaskId", args.externalTaskId),
			)
			.unique();

		if (existing) {
			return existing._id;
		}

		return await ctx.db.insert("eventTaskLinks", {
			eventId: args.eventId,
			externalTaskId: args.externalTaskId,
			provider: "linear",
			url: args.url,
		});
	},
});

export const unlinkTaskFromEvent = authMutation({
	args: {
		eventId: v.id("events"),
		externalTaskId: v.string(),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}
		if (event.userId !== ctx.user._id) {
			throw new Error("Not authorized to unlink task from this event");
		}

		const link = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_event_and_external_task", (q) =>
				q.eq("eventId", args.eventId).eq("externalTaskId", args.externalTaskId),
			)
			.unique();

		if (link) {
			await ctx.db.delete(link._id);
		}
	},
});
