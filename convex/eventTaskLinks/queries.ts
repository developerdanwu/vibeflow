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
		const events = await ctx.db
			.query("events")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.collect();
		const scheduledIds = new Set<string>();
		for (const event of events) {
			const links = await ctx.db
				.query("eventTaskLinks")
				.withIndex("by_event", (q) => q.eq("eventId", event._id))
				.collect();
			for (const link of links) {
				if (link.linkType === "scheduled") {
					scheduledIds.add(link.externalTaskId);
				}
			}
		}
		return Array.from(scheduledIds);
	},
});

/**
 * Auth: returns task items (scheduled + related) linked to events on the given days.
 * Each day is a "yyyy-MM-dd" string. Returns one array of task items per day, in the same order as dateStrings.
 */
export const getTaskItemsLinkedToEventsOnDays = authQuery({
	args: {
		dateStrings: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		if (args.dateStrings.length === 0) {
			return [];
		}
		const dateSet = new Set(args.dateStrings);
		const events = await ctx.db
			.query("events")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.collect();
		const eventsOnDays = events.filter(
			(e) => e.startDateStr != null && dateSet.has(e.startDateStr),
		);
		const externalTaskIdsByDate = new Map<string, Set<string>>();
		for (const dateStr of args.dateStrings) {
			externalTaskIdsByDate.set(dateStr, new Set());
		}
		for (const event of eventsOnDays) {
			const dateStr = event.startDateStr;
			if (dateStr == null) continue;
			const set = externalTaskIdsByDate.get(dateStr);
			if (!set) continue;
			const links = await ctx.db
				.query("eventTaskLinks")
				.withIndex("by_event", (q) => q.eq("eventId", event._id))
				.collect();
			for (const link of links) {
				set.add(link.externalTaskId);
			}
		}
		const allExternalIds = new Set<string>();
		for (const set of externalTaskIdsByDate.values()) {
			for (const id of set) {
				allExternalIds.add(id);
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
