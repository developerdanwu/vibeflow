import { v } from "convex/values";
import { authMutation } from "../helpers";
import { ErrorCode, throwConvexError } from "../errors";

export const createCalendar = authMutation({
	args: {
		name: v.string(),
		color: v.string(),
		isDefault: v.boolean(),
	},
	handler: async (ctx, args) => {
		if (args.isDefault) {
			const existingDefault = await ctx.db
				.query("calendars")
				.withIndex("by_user_default", (q) =>
					q.eq("userId", ctx.user._id).eq("isDefault", true)
				)
				.first();

			if (existingDefault) {
				await ctx.db.patch(existingDefault._id, { isDefault: false });
			}
		}

		return await ctx.db.insert("calendars", {
			...args,
			userId: ctx.user._id,
		});
	},
});

export const updateCalendar = authMutation({
	args: {
		id: v.id("calendars"),
		name: v.optional(v.string()),
		color: v.optional(v.string()),
		isDefault: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const calendar = await ctx.db.get(id);

		if (!calendar) {
			throwConvexError(ErrorCode.CALENDAR_NOT_FOUND, "Calendar not found");
		}
		if (calendar.userId !== ctx.user._id) {
			throwConvexError(ErrorCode.NOT_AUTHORIZED, "Not authorized to update this calendar");
		}

		if (updates.isDefault === true) {
			const existingDefault = await ctx.db
				.query("calendars")
				.withIndex("by_user_default", (q) =>
					q.eq("userId", ctx.user._id).eq("isDefault", true)
				)
				.first();

			if (existingDefault && existingDefault._id !== id) {
				await ctx.db.patch(existingDefault._id, { isDefault: false });
			}
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, val]) => val !== undefined)
		);

		return await ctx.db.patch(id, cleanUpdates);
	},
});

export const deleteCalendar = authMutation({
	args: {
		id: v.id("calendars"),
	},
	handler: async (ctx, args) => {
		const calendar = await ctx.db.get(args.id);

		if (!calendar) {
			throwConvexError(ErrorCode.CALENDAR_NOT_FOUND, "Calendar not found");
		}
		if (calendar.userId !== ctx.user._id) {
			throwConvexError(ErrorCode.NOT_AUTHORIZED, "Not authorized to delete this calendar");
		}
		if (calendar.isDefault) {
			throwConvexError(ErrorCode.CANNOT_DELETE_DEFAULT_CALENDAR, "Cannot delete the default calendar");
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
