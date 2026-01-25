import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createEvent = mutation({
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		if (args.endDate < args.startDate) {
			throw new Error("End date must be after start date");
		}

		return await ctx.db.insert("events", {
			...args,
			userId: identity.subject,
		});
	},
});

export const updateEvent = mutation({
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const { id, ...updates } = args;
		const event = await ctx.db.get(id);

		if (!event) {
			throw new Error("Event not found");
		}
		if (event.userId !== identity.subject) {
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

export const deleteEvent = mutation({
	args: {
		id: v.id("events"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const event = await ctx.db.get(args.id);

		if (!event) {
			throw new Error("Event not found");
		}
		if (event.userId !== identity.subject) {
			throw new Error("Not authorized to delete this event");
		}

		return await ctx.db.delete(args.id);
	},
});

export const getEventsByUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		return await ctx.db
			.query("events")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.collect();
	},
});

export const getEventsByDateRange = query({
	args: {
		startDate: v.number(),
		endDate: v.number(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		const events = await ctx.db
			.query("events")
			.withIndex("by_user_and_date", (q) =>
				q.eq("userId", identity.subject).gte("startDate", args.startDate)
			)
			.collect();

		return events.filter((event) => event.startDate <= args.endDate);
	},
});

export const getEventById = query({
	args: {
		id: v.id("events"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const event = await ctx.db.get(args.id);

		if (!event) {
			return null;
		}
		if (event.userId !== identity.subject) {
			throw new Error("Not authorized to view this event");
		}

		return event;
	},
});
