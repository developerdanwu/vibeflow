import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/** Provider literal union for reuse by provider modules. */
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
			throw new Error("User not found");
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
			throw new Error("Connection not found");
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

/** Internal: get connection and external calendar for sync (sensitive). */
export const getConnectionAndExternalCalendar = internalQuery({
	args: {
		connectionId: v.id("calendarConnections"),
		externalCalendarId: v.string(),
	},
	handler: async (ctx, args) => {
		const connection = await ctx.db.get(args.connectionId);
		if (!connection) return null;
		const ext = await ctx.db
			.query("externalCalendars")
			.withIndex("by_connection_and_external_id", (q) =>
				q
					.eq("connectionId", args.connectionId)
					.eq("externalCalendarId", args.externalCalendarId)
			)
			.unique();
		if (!ext) return null;
		return {
			connection: {
				_id: connection._id,
				userId: connection.userId,
				refreshToken: connection.refreshToken,
				accessToken: connection.accessToken,
				accessTokenExpiresAt: connection.accessTokenExpiresAt,
			},
			externalCalendar: {
				_id: ext._id,
				calendarId: ext.calendarId,
				externalCalendarId: ext.externalCalendarId,
				syncToken: ext.syncToken,
			},
		};
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

/** Internal: get connectionId and externalCalendarId by channelId (Google webhook). */
export const getByChannelId = internalQuery({
	args: { channelId: v.string() },
	handler: async (ctx, args) => {
		const ext = await ctx.db
			.query("externalCalendars")
			.withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
			.unique();
		if (!ext) return null;
		const connection = await ctx.db.get(ext.connectionId);
		if (!connection) return null;
		return {
			connectionId: ext.connectionId,
			externalCalendarId: ext.externalCalendarId,
		};
	},
});

/** Internal: list (connectionId, externalCalendarId) where channel expires within 48h. */
export const getCalendarsNeedingChannelRenewal = internalQuery({
	args: {},
	handler: async (ctx) => {
		const cutoff = Date.now() + 48 * 60 * 60 * 1000;
		const all = await ctx.db.query("externalCalendars").collect();
		return all
			.filter(
				(ext) =>
					ext.channelId &&
					(!ext.expiration || ext.expiration < cutoff),
			)
			.map((ext) => ({
				connectionId: ext.connectionId,
				externalCalendarId: ext.externalCalendarId,
			}));
	},
});

/** Internal: list all (connectionId, externalCalendarId) for fallback sync. */
export const getAllSyncedCalendars = internalQuery({
	args: {},
	handler: async (ctx) => {
		const all = await ctx.db.query("externalCalendars").collect();
		return all.map((ext) => ({
			connectionId: ext.connectionId,
			externalCalendarId: ext.externalCalendarId,
		}));
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
