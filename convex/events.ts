import { v } from "convex/values";
import { authMutation, authQuery } from "./helpers";

export const createEvent = authMutation({
	args: {
		title: v.string(),
		description: v.optional(v.string()),
		startDate: v.number(),
		endDate: v.number(),
		calendarId: v.optional(v.id("calendars")),
		color: v.optional(v.string()),
		location: v.optional(v.string()),
		allDay: v.boolean(),
	},
	handler: async (ctx, args) => {
		if (args.endDate < args.startDate) {
			throw new Error("End date must be after start date");
		}

		return await ctx.db.insert("events", {
			...args,
			userId: ctx.user._id,
		});
	},
});

export const updateEvent = authMutation({
	args: {
		id: v.id("events"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
		calendarId: v.optional(v.id("calendars")),
		color: v.optional(v.string()),
		location: v.optional(v.string()),
		allDay: v.optional(v.boolean()),
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

		const newStartDate = updates.startDate ?? event.startDate;
		const newEndDate = updates.endDate ?? event.endDate;
		if (newEndDate < newStartDate) {
			throw new Error("End date must be after start date");
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined)
		);

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
		startDate: v.number(),
		endDate: v.number(),
	},
	handler: async (ctx, args) => {
		const events = await ctx.db
			.query("events")
			.withIndex("by_user_and_date", (q) =>
				q.eq("userId", ctx.user._id).gte("startDate", args.startDate)
			)
			.collect();

		return events.filter((event) => event.startDate <= args.endDate);
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
