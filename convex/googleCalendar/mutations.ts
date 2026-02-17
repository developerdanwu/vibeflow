import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { ErrorCode, throwConvexError } from "../errors";

/** Provider literal union for reuse in this module. */
export const providerValidator = v.union(
	v.literal("google"),
	v.literal("microsoft"),
);
export type CalendarProvider = "google" | "microsoft";

const connectionTokensValidator = {
	refreshToken: v.string(),
	accessToken: v.optional(v.string()),
	accessTokenExpiresAt: v.optional(v.number()),
};

/** Internal: save new connection after OAuth exchange. */
export const saveConnection = internalMutation({
	args: {
		provider: providerValidator,
		userId: v.id("users"),
		...connectionTokensValidator,
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) {
			throwConvexError(ErrorCode.USER_NOT_FOUND, "User not found");
		}
		const now = Date.now();
		return await ctx.db.insert("calendarConnections", {
			userId: args.userId,
			provider: args.provider,
			refreshToken: args.refreshToken,
			accessToken: args.accessToken ?? undefined,
			accessTokenExpiresAt: args.accessTokenExpiresAt,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/** Internal: update access token after refresh. */
export const updateConnectionTokens = internalMutation({
	args: {
		connectionId: v.id("calendarConnections"),
		accessToken: v.string(),
		accessTokenExpiresAt: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.connectionId, {
			accessToken: args.accessToken,
			accessTokenExpiresAt: args.accessTokenExpiresAt,
			updatedAt: Date.now(),
		});
	},
});

/** Internal: add external calendar and create Convex calendar; dedupe by (connectionId, externalCalendarId). */
export const addExternalCalendar = internalMutation({
	args: {
		connectionId: v.id("calendarConnections"),
		provider: providerValidator,
		externalCalendarId: v.string(),
		name: v.string(),
		color: v.string(),
	},
	handler: async (ctx, args) => {
		const connection = await ctx.db.get(args.connectionId);
		if (!connection || connection.userId === undefined) {
			throwConvexError(ErrorCode.CONNECTION_NOT_FOUND, "Connection not found");
		}
		const userId = connection.userId;
		const existing = await ctx.db
			.query("externalCalendars")
			.withIndex("by_connection_and_external_id", (q) =>
				q
					.eq("connectionId", args.connectionId)
					.eq("externalCalendarId", args.externalCalendarId)
			)
			.unique();
		if (existing) {
			return existing._id;
		}
		const calendarId = await ctx.db.insert("calendars", {
			name: args.name,
			color: args.color,
			userId,
			isDefault: false,
		});
		return await ctx.db.insert("externalCalendars", {
			connectionId: args.connectionId,
			provider: args.provider,
			externalCalendarId: args.externalCalendarId,
			calendarId,
			name: args.name,
			color: args.color,
		});
	},
});

const upsertEventPayloadValidator = {
	userId: v.id("users"),
	calendarId: v.optional(v.id("calendars")),
	title: v.string(),
	description: v.optional(v.string()),
	startTimestamp: v.number(),
	endTimestamp: v.number(),
	allDay: v.boolean(),
	startDateStr: v.optional(v.string()),
	endDateStr: v.optional(v.string()),
	startTime: v.optional(v.string()),
	endTime: v.optional(v.string()),
	timeZone: v.optional(v.string()),
	location: v.optional(v.string()),
	color: v.optional(v.string()),
	recurringEventId: v.optional(v.string()),
	recurrence: v.optional(v.array(v.string())),
	creatorEmail: v.optional(v.string()),
	organizerEmail: v.optional(v.string()),
	guestsCanModify: v.optional(v.boolean()),
	isEditable: v.optional(v.boolean()),
	busy: v.optional(
		v.union(
			v.literal("busy"),
			v.literal("free"),
			v.literal("tentative"),
			v.literal("outOfOffice"),
		),
	),
	visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
};

/** Internal: upsert event from external provider by (provider, externalCalendarId, externalEventId). */
export const upsertEventFromExternal = internalMutation({
	args: {
		provider: providerValidator,
		externalCalendarId: v.string(),
		externalEventId: v.string(),
		...upsertEventPayloadValidator,
	},
	handler: async (ctx, args) => {
		const { provider, externalCalendarId, externalEventId, ...payload } = args;
		const existing = await ctx.db
			.query("events")
			.withIndex("by_external_event", (q) =>
				q
					.eq("externalProvider", provider)
					.eq("externalCalendarId", externalCalendarId)
					.eq("externalEventId", externalEventId)
			)
			.unique();
		const doc = {
			...payload,
			externalProvider: provider,
			externalCalendarId,
			externalEventId,
			busy: payload.busy ?? "free",
			visibility: payload.visibility ?? "public",
		};
		if (existing) {
			await ctx.db.patch(existing._id, doc);
			return existing._id;
		}
		return await ctx.db.insert("events", doc);
	},
});

/** Internal: delete event by external id. */
export const deleteEventByExternalId = internalMutation({
	args: {
		provider: providerValidator,
		externalCalendarId: v.string(),
		externalEventId: v.string(),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db
			.query("events")
			.withIndex("by_external_event", (q) =>
				q
					.eq("externalProvider", args.provider)
					.eq("externalCalendarId", args.externalCalendarId)
					.eq("externalEventId", args.externalEventId)
			)
			.unique();
		if (event) {
			await ctx.db.delete(event._id);
		}
	},
});

const deleteEventByExternalIdItemValidator = {
	provider: providerValidator,
	externalCalendarId: v.string(),
	externalEventId: v.string(),
};

/** Internal: delete multiple events by external id (batch for sync). */
export const deleteEventsByExternalIdBatch = internalMutation({
	args: {
		deletes: v.array(v.object(deleteEventByExternalIdItemValidator)),
	},
	handler: async (ctx, args) => {
		for (const d of args.deletes) {
			const event = await ctx.db
				.query("events")
				.withIndex("by_external_event", (q) =>
					q
						.eq("externalProvider", d.provider)
						.eq("externalCalendarId", d.externalCalendarId)
						.eq("externalEventId", d.externalEventId)
				)
				.unique();
			if (event) {
				await ctx.db.delete(event._id);
			}
		}
	},
});

const upsertEventFromExternalItemValidator = {
	provider: providerValidator,
	externalCalendarId: v.string(),
	externalEventId: v.string(),
	...upsertEventPayloadValidator,
};

/** Internal: upsert multiple events from external provider (batch for sync). */
export const upsertEventsFromExternalBatch = internalMutation({
	args: {
		events: v.array(v.object(upsertEventFromExternalItemValidator)),
	},
	handler: async (ctx, args) => {
		for (const ev of args.events) {
			const { provider, externalCalendarId, externalEventId, ...payload } = ev;
			const existing = await ctx.db
				.query("events")
				.withIndex("by_external_event", (q) =>
					q
						.eq("externalProvider", provider)
						.eq("externalCalendarId", externalCalendarId)
						.eq("externalEventId", externalEventId)
				)
				.unique();
			const doc = {
				...payload,
				externalProvider: provider,
				externalCalendarId,
				externalEventId,
				busy: payload.busy ?? "free",
				visibility: payload.visibility ?? "public",
			};
			if (existing) {
				await ctx.db.patch(existing._id, doc);
			} else {
				await ctx.db.insert("events", doc);
			}
		}
	},
});

/** Internal: update sync token after a sync run. */
export const updateExternalCalendarSyncToken = internalMutation({
	args: {
		connectionId: v.id("calendarConnections"),
		externalCalendarId: v.string(),
		syncToken: v.string(),
	},
	handler: async (ctx, args) => {
		const ext = await ctx.db
			.query("externalCalendars")
			.withIndex("by_connection_and_external_id", (q) =>
				q
					.eq("connectionId", args.connectionId)
					.eq("externalCalendarId", args.externalCalendarId)
			)
			.unique();
		if (ext) {
			await ctx.db.patch(ext._id, { syncToken: args.syncToken });
		}
	},
});

/** Internal: update watch channel info (Google push). */
export const updateExternalCalendarChannel = internalMutation({
	args: {
		connectionId: v.id("calendarConnections"),
		externalCalendarId: v.string(),
		channelId: v.string(),
		resourceId: v.string(),
		expiration: v.number(),
	},
	handler: async (ctx, args) => {
		const ext = await ctx.db
			.query("externalCalendars")
			.withIndex("by_connection_and_external_id", (q) =>
				q
					.eq("connectionId", args.connectionId)
					.eq("externalCalendarId", args.externalCalendarId)
			)
			.unique();
		if (ext) {
			await ctx.db.patch(ext._id, {
				channelId: args.channelId,
				resourceId: args.resourceId,
				expiration: args.expiration,
			});
		}
	},
});

/** Internal: patch event with Google Calendar external fields after outbound create. */
export const patchEventExternalFields = internalMutation({
	args: {
		eventId: v.id("events"),
		externalProvider: providerValidator,
		externalCalendarId: v.string(),
		externalEventId: v.string(),
		isEditable: v.boolean(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.eventId, {
			externalProvider: args.externalProvider,
			externalCalendarId: args.externalCalendarId,
			externalEventId: args.externalEventId,
			isEditable: args.isEditable,
		});
	},
});
