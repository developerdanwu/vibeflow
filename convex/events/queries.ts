import { v } from "convex/values";
import { authQuery } from "../helpers";
import { internalQuery } from "../_generated/server";
import { ErrorCode, throwConvexError } from "../errors";

export const getEventsByUser = authQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("events")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.collect();
	},
});

export const getEventsByDateRange = authQuery({
	args: {
		startTimestamp: v.number(),
		endTimestamp: v.number(),
	},
	handler: async (ctx, args) => {
		const ONE_DAY_MS = 24 * 60 * 60 * 1000;
		const bufferedStart = args.startTimestamp - ONE_DAY_MS;
		const bufferedEnd = args.endTimestamp + ONE_DAY_MS;

		const events = await ctx.db
			.query("events")
			.withIndex("by_user_and_date", (q) =>
				q.eq("userId", ctx.user._id).gte("startTimestamp", bufferedStart),
			)
			.collect();

		return events.filter((event) => event.startTimestamp <= bufferedEnd);
	},
});

export const getEventById = authQuery({
	args: {
		id: v.id("events"),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get("events", args.id);

		if (!event) {
			return null;
		}
		if (event.userId !== ctx.user._id) {
			throwConvexError(
				ErrorCode.NOT_AUTHORIZED,
				"Not authorized to view this event",
			);
		}

		return event;
	},
});

/** Internal: get event by id for sync operations. */
export const getEventByIdInternal = internalQuery({
	args: { id: v.id("events") },
	handler: async (ctx, args) => {
		return await ctx.db.get("events", args.id);
	},
});
