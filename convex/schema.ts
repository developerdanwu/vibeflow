import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	products: defineTable({
		title: v.string(),
		imageId: v.string(),
		price: v.number(),
	}),
	todos: defineTable({
		text: v.string(),
		completed: v.boolean(),
	}),

	events: defineTable({
		title: v.string(),
		description: v.optional(v.string()),
		startDate: v.number(),
		endDate: v.number(),
		userId: v.string(),
		calendarId: v.optional(v.id("calendars")),
		color: v.optional(v.string()),
		location: v.optional(v.string()),
		allDay: v.boolean(),
	})
		.index("by_user", ["userId"])
		.index("by_user_and_date", ["userId", "startDate"])
		.index("by_calendar", ["calendarId"]),

	calendars: defineTable({
		name: v.string(),
		color: v.string(),
		userId: v.string(),
		isDefault: v.boolean(),
	})
		.index("by_user", ["userId"])
		.index("by_user_default", ["userId", "isDefault"]),

	userPreferences: defineTable({
		userId: v.string(),
		defaultView: v.optional(
			v.union(
				v.literal("day"),
				v.literal("week"),
				v.literal("month"),
				v.literal("year"),
				v.literal("agenda")
			)
		),
		weekStartDay: v.optional(v.number()),
		timeFormat: v.optional(v.union(v.literal("12h"), v.literal("24h"))),
		timezone: v.optional(v.string()),
	}).index("by_user", ["userId"]),
});
