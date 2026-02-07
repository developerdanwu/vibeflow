import { v } from "convex/values";
import { authMutation, authQuery } from "./helpers";

export const createEvent = authMutation({
	args: {
		title: v.string(),
		description: v.optional(v.string()),
		startTimestamp: v.optional(v.number()),
		endTimestamp: v.optional(v.number()),
		calendarId: v.optional(v.id("calendars")),
		color: v.optional(v.string()),
		location: v.optional(v.string()),
		allDay: v.boolean(),
		startDateStr: v.optional(v.string()),
		endDateStr: v.optional(v.string()),
		startTime: v.optional(v.string()),
		endTime: v.optional(v.string()),
		timeZone: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Use provided timestamps, or derive from date strings for all-day only
		let derivedStartTimestamp = args.startTimestamp;
		let derivedEndTimestamp = args.endTimestamp;

		if (derivedStartTimestamp === undefined || derivedEndTimestamp === undefined) {
			if (args.allDay && args.startDateStr && args.endDateStr) {
				// All-day: UTC midnight of the dates
				const startDateObj = new Date(args.startDateStr + "T00:00:00Z");
				const endDateObj = new Date(args.endDateStr + "T00:00:00Z");
				derivedStartTimestamp = startDateObj.getTime();
				derivedEndTimestamp = endDateObj.getTime();
			} else {
				throw new Error(
					"Must provide startTimestamp/endTimestamp for timed events, or startDateStr/endDateStr for all-day events"
				);
			}
		}

		// Validate end timestamp is after start timestamp
		if (derivedEndTimestamp < derivedStartTimestamp) {
			throw new Error("End date must be after start date");
		}

		return await ctx.db.insert("events", {
			...args,
			startTimestamp: derivedStartTimestamp,
			endTimestamp: derivedEndTimestamp,
			userId: ctx.user._id,
		});
	},
});

export const updateEvent = authMutation({
	args: {
		id: v.id("events"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		startTimestamp: v.optional(v.number()),
		endTimestamp: v.optional(v.number()),
		calendarId: v.optional(v.id("calendars")),
		color: v.optional(v.string()),
		location: v.optional(v.string()),
		allDay: v.optional(v.boolean()),
		startDateStr: v.optional(v.string()),
		endDateStr: v.optional(v.string()),
		startTime: v.optional(v.string()),
		endTime: v.optional(v.string()),
		timeZone: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const event = await ctx.db.get(id);

		if (!event) {
			throw new Error("Event not found");
		}
		if (event.userId !== ctx.user._id) {
			throw new Error("Not authorized to update this event");
		}

		const allDay = updates.allDay ?? event.allDay;

		let derivedStartTimestamp = updates.startTimestamp;
		let derivedEndTimestamp = updates.endTimestamp;

		if (
			updates.startDateStr ||
			updates.endDateStr ||
			updates.startTime ||
			updates.endTime ||
			updates.timeZone
		) {
			const startDateStr = updates.startDateStr ?? event.startDateStr;
			const endDateStr = updates.endDateStr ?? event.endDateStr;
			const startTime = updates.startTime ?? event.startTime;
			const endTime = updates.endTime ?? event.endTime;
			const timeZone = updates.timeZone ?? event.timeZone;

			if (allDay && startDateStr && endDateStr) {
				const startDateObj = new Date(startDateStr + "T00:00:00Z");
				const endDateObj = new Date(endDateStr + "T00:00:00Z");
				derivedStartTimestamp = startDateObj.getTime();
				derivedEndTimestamp = endDateObj.getTime();
			} else if (!allDay && startDateStr && startTime && endDateStr && endTime && timeZone) {
				const startDateObj = new Date(`${startDateStr}T${startTime}:00Z`);
				const endDateObj = new Date(`${endDateStr}T${endTime}:00Z`);
				derivedStartTimestamp = startDateObj.getTime();
				derivedEndTimestamp = endDateObj.getTime();
			}
		}

		const newStartTimestamp = derivedStartTimestamp ?? updates.startTimestamp ?? event.startTimestamp;
		const newEndTimestamp = derivedEndTimestamp ?? updates.endTimestamp ?? event.endTimestamp;

		if (newEndTimestamp < newStartTimestamp) {
			throw new Error("End date must be after start date");
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined)
		);

		if (derivedStartTimestamp !== undefined) {
			cleanUpdates.startTimestamp = derivedStartTimestamp;
		}
		if (derivedEndTimestamp !== undefined) {
			cleanUpdates.endTimestamp = derivedEndTimestamp;
		}

		return await ctx.db.patch(id, cleanUpdates);
	},
});

export const deleteEvent = authMutation({
	args: {
		id: v.id("events"),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.id);

		if (!event) {
			throw new Error("Event not found");
		}
		if (event.userId !== ctx.user._id) {
			throw new Error("Not authorized to delete this event");
		}

		return await ctx.db.delete(args.id);
	},
});

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
				q.eq("userId", ctx.user._id).gte("startTimestamp", bufferedStart)
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
		const event = await ctx.db.get(args.id);

		if (!event) {
			return null;
		}
		if (event.userId !== ctx.user._id) {
			throw new Error("Not authorized to view this event");
		}

		return event;
	},
});
