import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		authId: v.string(),
		email: v.string(),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		fullName: v.string(),
		profileImageUrl: v.optional(v.string()),
		updatedAt: v.number(),
	}).index("authId", ["authId"]),

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
		startTimestamp: v.number(),
		endTimestamp: v.number(),
		userId: v.id("users"),
		calendarId: v.optional(v.id("calendars")),
		color: v.optional(v.string()),
		location: v.optional(v.string()),
		allDay: v.boolean(),
		startDateStr: v.optional(v.string()),
		endDateStr: v.optional(v.string()),
		startTime: v.optional(v.string()),
		endTime: v.optional(v.string()),
		timeZone: v.optional(v.string()),
	})
		.index("by_user", ["userId"])
		.index("by_user_and_date", ["userId", "startTimestamp"])
		.index("by_calendar", ["calendarId"]),

	calendars: defineTable({
		name: v.string(),
		color: v.string(),
		userId: v.id("users"),
		isDefault: v.boolean(),
	})
		.index("by_user", ["userId"])
		.index("by_user_default", ["userId", "isDefault"]),

	userPreferences: defineTable({
		userId: v.id("users"),
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
