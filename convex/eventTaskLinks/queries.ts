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

/** Auth: returns external task IDs that are scheduled on any of the current user's events. */
export const getScheduledExternalTaskIdsForCurrentUser = authQuery({
	args: {},
	handler: async (ctx) => {
		const links = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_user_and_link_type", (q) =>
				q.eq("userId", ctx.user._id).eq("linkType", "scheduled"),
			)
			.collect();
		return [...new Set(links.map((l) => l.externalTaskId))];
	},
});

/**
 * Auth: returns task items (scheduled + related) linked to events on the given days.
 * Each day is a "yyyy-MM-dd" string. Returns one array of task items per day, in the same order as dateStrings.
 * Uses events.by_user_and_date_str and eventTaskLinks.by_event indexes.
 */
export const getTaskItemsLinkedToEventsOnDays = authQuery({
	args: {
		dateStrings: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		if (args.dateStrings.length === 0) {
			return [];
		}
		const externalTaskIdsByDate = new Map<string, Set<string>>();
		for (const dateStr of args.dateStrings) {
			externalTaskIdsByDate.set(dateStr, new Set());
		}
		for (const dateStr of args.dateStrings) {
			const eventsOnDay = await ctx.db
				.query("events")
				.withIndex("by_user_and_date_str", (q) =>
					q.eq("userId", ctx.user._id).eq("startDateStr", dateStr),
				)
				.collect();
			const set = externalTaskIdsByDate.get(dateStr);
			if (!set) continue;
			for (const event of eventsOnDay) {
				const links = await ctx.db
					.query("eventTaskLinks")
					.withIndex("by_event", (q) => q.eq("eventId", event._id))
					.collect();
				for (const link of links) {
					set.add(link.externalTaskId);
				}
			}
		}
		const taskItems = await ctx.db
			.query("taskItems")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", ctx.user._id).eq("provider", "linear"),
			)
			.collect();
		const byExternalId = new Map(
			taskItems.map((t) => [t.externalTaskId, t] as const),
		);
		return args.dateStrings.map((dateStr) => {
			const ids = externalTaskIdsByDate.get(dateStr);
			if (!ids || ids.size === 0) return [];
			const items: (typeof taskItems)[number][] = [];
			for (const externalTaskId of ids) {
				const doc = byExternalId.get(externalTaskId);
				if (doc) items.push(doc);
			}
			return items;
		});
	},
});
