import { z } from "zod";
import { zid } from "convex-helpers/server/zod4";
import { authMutation } from "../helpers";
import { ErrorCode, throwConvexError } from "../errors";

export const createCalendar = authMutation({
	args: z.object({
		name: z.string(),
		color: z.string(),
		isDefault: z.boolean(),
	}),
	handler: async (ctx, args) => {
		if (args.isDefault) {
			const existingDefault = await ctx.db
				.query("calendars")
				.withIndex("by_user_default", (q) =>
					q.eq("userId", ctx.user._id).eq("isDefault", true),
				)
				.first();

			if (existingDefault) {
				await ctx.db.patch("calendars", existingDefault._id, {
				isDefault: false,
			});
			}
		}

		return await ctx.db.insert("calendars", {
			...args,
			userId: ctx.user._id,
		});
	},
});

export const updateCalendar = authMutation({
	args: z.object({
		id: zid("calendars"),
		name: z.string().optional(),
		color: z.string().optional(),
		isDefault: z.boolean().optional(),
	}),
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const calendar = await ctx.db.get("calendars", id);

		if (!calendar) {
			throwConvexError(ErrorCode.CALENDAR_NOT_FOUND, "Calendar not found");
		}
		if (calendar.userId !== ctx.user._id) {
			throwConvexError(
				ErrorCode.NOT_AUTHORIZED,
				"Not authorized to update this calendar",
			);
		}

		if (updates.isDefault === true) {
			const existingDefault = await ctx.db
				.query("calendars")
				.withIndex("by_user_default", (q) =>
					q.eq("userId", ctx.user._id).eq("isDefault", true),
				)
				.first();

			if (existingDefault && existingDefault._id !== id) {
				await ctx.db.patch("calendars", existingDefault._id, {
				isDefault: false,
			});
			}
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, val]) => val !== undefined),
		);

		return await ctx.db.patch("calendars", id, cleanUpdates);
	},
});

export const deleteCalendar = authMutation({
	args: z.object({
		id: zid("calendars"),
	}),
	handler: async (ctx, args) => {
		const calendar = await ctx.db.get("calendars", args.id);

		if (!calendar) {
			throwConvexError(ErrorCode.CALENDAR_NOT_FOUND, "Calendar not found");
		}
		if (calendar.userId !== ctx.user._id) {
			throwConvexError(
				ErrorCode.NOT_AUTHORIZED,
				"Not authorized to delete this calendar",
			);
		}
		if (calendar.isDefault) {
			throwConvexError(
				ErrorCode.CANNOT_DELETE_DEFAULT_CALENDAR,
				"Cannot delete the default calendar",
			);
		}

		const eventsInCalendar = await ctx.db
			.query("events")
			.withIndex("by_calendar", (q) => q.eq("calendarId", args.id))
			.collect();

		for (const event of eventsInCalendar) {
			await ctx.db.patch("events", event._id, {
			calendarId: undefined,
		});
		}

		return await ctx.db.delete("calendars", args.id);
	},
});
