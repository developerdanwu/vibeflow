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
		externalProvider: v.optional(
			v.union(v.literal("google"), v.literal("microsoft")),
		),
		externalCalendarId: v.optional(v.string()),
		externalEventId: v.optional(v.string()),
		recurringEventId: v.optional(v.string()),
		recurrence: v.optional(v.array(v.string())),
		creatorEmail: v.optional(v.string()),
		organizerEmail: v.optional(v.string()),
		guestsCanModify: v.optional(v.boolean()),
		isEditable: v.optional(v.boolean()),
		busy: v.union(
			v.literal("busy"),
			v.literal("free"),
			v.literal("tentative"),
			v.literal("outOfOffice"),
		),
		visibility: v.union(v.literal("public"), v.literal("private")),
		eventKind: v.optional(v.union(v.literal("event"), v.literal("task"))),
	})
		.index("by_user", ["userId"])
		.index("by_user_and_date", ["userId", "startTimestamp"])
		.index("by_calendar", ["calendarId"])
		.index("by_user_and_date_str", ["userId", "startDateStr"])
		.index("by_external_event", [
			"externalProvider",
			"externalCalendarId",
			"externalEventId",
		])
		.index("by_recurring_event", ["recurringEventId"]),
	calendars: defineTable({
		name: v.string(),
		color: v.string(),
		userId: v.id("users"),
		isDefault: v.boolean(),
	})
		.index("by_user", ["userId"])
		.index("by_user_default", ["userId", "isDefault"]),
	calendarConnections: defineTable({
		userId: v.id("users"),
		provider: v.union(v.literal("google"), v.literal("microsoft")),
		refreshToken: v.string(),
		accessToken: v.optional(v.string()),
		accessTokenExpiresAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user_and_provider", ["userId", "provider"]),
	externalCalendars: defineTable({
		connectionId: v.id("calendarConnections"),
		provider: v.union(v.literal("google"), v.literal("microsoft")),
		externalCalendarId: v.string(),
		calendarId: v.optional(v.id("calendars")),
		name: v.string(),
		color: v.string(),
		syncToken: v.optional(v.string()),
		channelId: v.optional(v.string()),
		resourceId: v.optional(v.string()),
		expiration: v.optional(v.number()),
		subscriptionId: v.optional(v.string()),
	})
		.index("by_connection", ["connectionId"])
		.index("by_connection_and_external_id", [
			"connectionId",
			"externalCalendarId",
		])
		.index("by_channel", ["channelId"])
		.index("by_calendar", ["calendarId"]),

	userPreferences: defineTable({
		userId: v.id("users"),
		defaultView: v.optional(
			v.union(
				v.literal("day"),
				v.literal("week"),
				v.literal("month"),
				v.literal("year"),
				v.literal("agenda"),
			),
		),
		weekStartDay: v.optional(v.number()),
		timeFormat: v.optional(v.union(v.literal("12h"), v.literal("24h"))),
		timezone: v.optional(v.string()),
		calendarSyncFromMonths: v.optional(v.number()),
	}).index("by_user", ["userId"]),
	taskConnections: defineTable({
		userId: v.id("users"),
		provider: v.union(v.literal("linear")),
		accessToken: v.string(),
		refreshToken: v.optional(v.string()),
		accessTokenExpiresAt: v.optional(v.number()),
		providerMetadata: v.optional(v.any()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user_and_provider", ["userId", "provider"]),
	taskItems: defineTable({
		userId: v.id("users"),
		connectionId: v.id("taskConnections"),
		provider: v.union(v.literal("linear")),
		externalTaskId: v.string(),
		title: v.string(),
		identifier: v.optional(v.string()),
		state: v.optional(v.string()),
		priority: v.optional(v.number()),
		dueDate: v.optional(v.string()),
		projectName: v.optional(v.string()),
		projectId: v.optional(v.string()),
		url: v.string(),
		updatedAt: v.number(),
	})
		.index("by_user_and_provider", ["userId", "provider"])
		.index("by_external_task", ["provider", "externalTaskId"]),
	eventTaskLinks: defineTable({
		eventId: v.id("events"),
		userId: v.optional(v.id("users")),
		externalTaskId: v.string(),
		provider: v.union(v.literal("linear")),
		url: v.string(),
		linkType: v.optional(v.union(v.literal("scheduled"), v.literal("related"))),
	})
		.index("by_event", ["eventId"])
		.index("by_user_and_link_type", ["userId", "linkType"])
		.index("by_external_task", ["provider", "externalTaskId"])
		.index("by_event_and_external_task", ["eventId", "externalTaskId"]),
});
