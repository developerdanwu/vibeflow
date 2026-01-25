import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createCalendar = mutation({
	args: {
		name: v.string(),
		color: v.string(),
		isDefault: v.boolean(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const userId = identity.subject;

		if (args.isDefault) {
			const existingDefault = await ctx.db
				.query("calendars")
				.withIndex("by_user_default", (q) =>
					q.eq("userId", userId).eq("isDefault", true)
				)
				.first();

			if (existingDefault) {
				await ctx.db.patch(existingDefault._id, { isDefault: false });
			}
		}

		return await ctx.db.insert("calendars", {
			...args,
			userId,
		});
	},
});

export const updateCalendar = mutation({
	args: {
		id: v.id("calendars"),
		name: v.optional(v.string()),
		color: v.optional(v.string()),
		isDefault: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const { id, ...updates } = args;
		const calendar = await ctx.db.get(id);

		if (!calendar) {
			throw new Error("Calendar not found");
		}
		if (calendar.userId !== identity.subject) {
			throw new Error("Not authorized to update this calendar");
		}

		if (updates.isDefault === true) {
			const existingDefault = await ctx.db
				.query("calendars")
				.withIndex("by_user_default", (q) =>
					q.eq("userId", identity.subject).eq("isDefault", true)
				)
				.first();

			if (existingDefault && existingDefault._id !== id) {
				await ctx.db.patch(existingDefault._id, { isDefault: false });
			}
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined)
		);

		return await ctx.db.patch(id, cleanUpdates);
	},
});

export const deleteCalendar = mutation({
	args: {
		id: v.id("calendars"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const calendar = await ctx.db.get(args.id);

		if (!calendar) {
			throw new Error("Calendar not found");
		}
		if (calendar.userId !== identity.subject) {
			throw new Error("Not authorized to delete this calendar");
		}
		if (calendar.isDefault) {
			throw new Error("Cannot delete the default calendar");
		}

		const eventsInCalendar = await ctx.db
			.query("events")
			.withIndex("by_calendar", (q) => q.eq("calendarId", args.id))
			.collect();

		for (const event of eventsInCalendar) {
			await ctx.db.patch(event._id, { calendarId: undefined });
		}

		return await ctx.db.delete(args.id);
	},
});

export const getUserCalendars = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		return await ctx.db
			.query("calendars")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.collect();
	},
});

export const getDefaultCalendar = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		return await ctx.db
			.query("calendars")
			.withIndex("by_user_default", (q) =>
				q.eq("userId", identity.subject).eq("isDefault", true)
			)
			.first();
	},
});
