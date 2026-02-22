import { v } from "convex/values";
import { z } from "zod";
import { internalQuery } from "../_generated/server";
import { authQuery } from "../helpers";
import { providerValidator } from "./mutations";

/** Auth: get current user's Google connection and calendars for UI. */
export const getMyGoogleConnection = authQuery({
	args: z.object({}),
	handler: async (ctx) => {
		const connection = await ctx.db
			.query("calendarConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", ctx.user._id).eq("provider", "google"),
			)
			.unique();
		if (!connection) return null;
		const externalCalendars = await ctx.db
			.query("externalCalendars")
			.withIndex("by_connection", (q) => q.eq("connectionId", connection._id))
			.collect();
		return {
			connectionId: connection._id,
			googleCalendars: externalCalendars.map((ext) => ({
				_id: ext._id,
				googleCalendarId: ext.externalCalendarId,
				calendarId: ext.calendarId,
				name: ext.name,
				color: ext.color,
			})),
		};
	},
});

/** Internal: get connection id and external calendar ids for a user (for syncMyCalendars). */
export const getConnectionByUserId = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const connection = await ctx.db
			.query("calendarConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", args.userId).eq("provider", "google"),
			)
			.unique();
		if (!connection) return null;
		const externalCalendars = await ctx.db
			.query("externalCalendars")
			.withIndex("by_connection", (q) => q.eq("connectionId", connection._id))
			.collect();
		return {
			connectionId: connection._id,
			externalCalendarIds: externalCalendars.map(
				(ext) => ext.externalCalendarId,
			),
		};
	},
});

/** Internal: get external calendar by Convex calendarId (for outbound sync). */
export const getExternalCalendarByCalendarId = internalQuery({
	args: { calendarId: v.id("calendars") },
	handler: async (ctx, args) => {
		const ext = await ctx.db
			.query("externalCalendars")
			.withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
			.unique();
		return ext ?? null;
	},
});

/** Internal: get external calendar by provider and externalCalendarId. */
export const getExternalCalendarByExternalId = internalQuery({
	args: {
		provider: providerValidator,
		externalCalendarId: v.string(),
	},
	handler: async (ctx, args) => {
		const ext = await ctx.db
			.query("externalCalendars")
			.withIndex("by_provider_and_external_id", (q) =>
				q
					.eq("provider", args.provider)
					.eq("externalCalendarId", args.externalCalendarId),
			)
			.first();
		return ext ?? null;
	},
});

/** Internal: get connection and external calendar for sync (sensitive). */
export const getConnectionAndExternalCalendar = internalQuery({
	args: {
		connectionId: v.id("calendarConnections"),
		externalCalendarId: v.string(),
	},
	handler: async (ctx, args) => {
		const connection = await ctx.db.get(
			"calendarConnections",
			args.connectionId,
		);
		if (!connection) return null;
		const ext = await ctx.db
			.query("externalCalendars")
			.withIndex("by_connection_and_external_id", (q) =>
				q
					.eq("connectionId", args.connectionId)
					.eq("externalCalendarId", args.externalCalendarId),
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

/** Internal: get connectionId and externalCalendarId by channelId (Google webhook). */
export const getByChannelId = internalQuery({
	args: { channelId: v.string() },
	handler: async (ctx, args) => {
		const ext = await ctx.db
			.query("externalCalendars")
			.withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
			.unique();
		if (!ext) return null;
		const connection = await ctx.db.get(
			"calendarConnections",
			ext.connectionId,
		);
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
				(ext) => ext.channelId && (!ext.expiration || ext.expiration < cutoff),
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
