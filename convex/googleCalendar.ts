import { v } from "convex/values";
import {
	action,
	httpAction,
	internalAction,
	internalQuery,
} from "./_generated/server";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { authQuery } from "./helpers";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_LIST_URL =
	"https://www.googleapis.com/calendar/v3/users/me/calendarList";
const GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars";

type StatePayload = { userId: string; provider?: "google" | "microsoft" };

function decodeState(state: string): StatePayload {
	try {
		const decoded = atob(state.replace(/-/g, "+").replace(/_/g, "/"));
		return JSON.parse(decoded) as StatePayload;
	} catch {
		throw new Error("Invalid state parameter");
	}
}

/** Auth: get current user's Google connection and calendars for UI. */
export const getMyGoogleConnection = authQuery({
	args: {},
	handler: async (ctx) => {
		const connection = await ctx.db
			.query("calendarConnections")
			.withIndex("by_user_and_provider", (q) =>
				q.eq("userId", ctx.user._id).eq("provider", "google")
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
				q.eq("userId", args.userId).eq("provider", "google")
			)
			.unique();
		if (!connection) return null;
		const externalCalendars = await ctx.db
			.query("externalCalendars")
			.withIndex("by_connection", (q) => q.eq("connectionId", connection._id))
			.collect();
		return {
			connectionId: connection._id,
			externalCalendarIds: externalCalendars.map((ext) => ext.externalCalendarId),
		};
	},
});

type UpsertEventPayload = {
	userId: Id<"users">;
	calendarId: Id<"calendars"> | undefined;
	title: string;
	description?: string;
	startTimestamp: number;
	endTimestamp: number;
	allDay: boolean;
	startDateStr?: string;
	endDateStr?: string;
	startTime?: string;
	endTime?: string;
	timeZone?: string;
	location?: string;
	color?: string;
	recurringEventId?: string;
	creatorEmail?: string;
	organizerEmail?: string;
	guestsCanModify?: boolean;
	isEditable?: boolean;
};

function computeIsEditable(
	userEmail: string,
	creatorEmail?: string,
	organizerEmail?: string,
	guestsCanModify?: boolean,
): boolean {
	if (creatorEmail === userEmail || organizerEmail === userEmail) {
		return true;
	}
	if (guestsCanModify === true) {
		return true;
	}
	return false;
}

function googleEventToPayload(
	userId: Id<"users">,
	calendarId: Id<"calendars"> | undefined,
	item: GoogleCalendarEvent,
	userEmail: string,
): UpsertEventPayload & { externalEventId: string } {
	const start = item.start?.dateTime
		? new Date(item.start.dateTime).getTime()
		: item.start?.date
			? new Date(item.start.date + "T00:00:00Z").getTime()
			: 0;
	const end = item.end?.dateTime
		? new Date(item.end.dateTime).getTime()
		: item.end?.date
			? new Date(item.end.date + "T00:00:00Z").getTime()
			: start + 60 * 60 * 1000;
	const allDay = Boolean(item.start?.date && !item.start?.dateTime);
	let startDateStr: string | undefined;
	let endDateStr: string | undefined;
	let startTime: string | undefined;
	let endTime: string | undefined;
	const tz = item.start?.timeZone ?? item.end?.timeZone;
	if (allDay && item.start?.date) {
		startDateStr = item.start.date;
		endDateStr = item.end?.date ?? item.start.date;
	} else if (item.start?.dateTime && item.end?.dateTime) {
		const s = new Date(item.start.dateTime);
		const e = new Date(item.end.dateTime);
		startDateStr = s.toISOString().slice(0, 10);
		endDateStr = e.toISOString().slice(0, 10);
		startTime = s.toISOString().slice(11, 16);
		endTime = e.toISOString().slice(11, 16);
	}
	const creatorEmail = item.creator?.email;
	const organizerEmail = item.organizer?.email;
	const guestsCanModify = item.guestsCanModify;
	const isEditable = computeIsEditable(
		userEmail,
		creatorEmail,
		organizerEmail,
		guestsCanModify,
	);
	return {
		userId,
		calendarId,
		externalEventId: item.id ?? "",
		title: item.summary ?? "(No title)",
		description: item.description,
		startTimestamp: start,
		endTimestamp: end,
		allDay,
		startDateStr,
		endDateStr,
		startTime,
		endTime,
		timeZone: tz,
		location: item.location,
		color: undefined,
		recurringEventId: item.recurringEventId ?? undefined,
		creatorEmail,
		organizerEmail,
		guestsCanModify,
		isEditable,
	};
}

type GoogleCalendarEvent = {
	id?: string;
	summary?: string;
	description?: string;
	location?: string;
	start?: { date?: string; dateTime?: string; timeZone?: string };
	end?: { date?: string; dateTime?: string; timeZone?: string };
	status?: string;
	recurringEventId?: string;
	recurrence?: string[];
	originalStartTime?: { date?: string; dateTime?: string; timeZone?: string };
	creator?: { email?: string };
	organizer?: { email?: string };
	guestsCanModify?: boolean;
};

/** Exchange OAuth code for tokens, store connection, fetch and store calendar list. */
export const exchangeCode = action({
	args: {
		code: v.string(),
		state: v.string(),
		redirectUri: v.string(),
	},
	handler: async (
		ctx,
		args
	): Promise<{ connectionId: Id<"calendarConnections"> }> => {
		const { userId: userIdStr } = decodeState(args.state);
		const userId = userIdStr as Id<"users">;

		const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
		const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
		if (!clientId || !clientSecret) {
			throw new Error("Google Calendar OAuth not configured");
		}

		const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				code: args.code,
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: args.redirectUri,
				grant_type: "authorization_code",
			}),
		});
		if (!tokenRes.ok) {
			const err = await tokenRes.text();
			throw new Error(`Token exchange failed: ${err}`);
		}
		const tokens = (await tokenRes.json()) as {
			access_token: string;
			refresh_token?: string;
			expires_in?: number;
		};
		if (!tokens.refresh_token) {
			throw new Error("No refresh token returned");
		}
		const now = Date.now();
		const accessTokenExpiresAt = tokens.expires_in
			? now + tokens.expires_in * 1000
			: undefined;

		const connectionId = (await ctx.runMutation(
			internal.calendarSync.saveConnection,
			{
				provider: "google",
				userId,
				refreshToken: tokens.refresh_token,
				accessToken: tokens.access_token,
				accessTokenExpiresAt,
			}
		)) as Id<"calendarConnections">;

		// Fetch calendar list and add each as external calendar + Convex calendar
		const listRes = await fetch(GOOGLE_CALENDAR_LIST_URL, {
			headers: { Authorization: `Bearer ${tokens.access_token}` },
		});
		if (listRes.ok) {
			const data = (await listRes.json()) as {
				items?: { id: string; summary?: string; backgroundColor?: string }[];
			};
			const items = data.items ?? [];
			const colorMap: Record<string, string> = {
				"#9e69af": "purple",
				"#7986cb": "blue",
				"#5c6bc0": "blue",
				"#3f51b5": "blue",
				"#4285f4": "blue",
				"#039be5": "blue",
				"#0097a7": "blue",
				"#009688": "green",
				"#43a047": "green",
				"#7cb342": "green",
				"#afb42b": "yellow",
				"#f9a825": "yellow",
				"#ff9800": "orange",
				"#ef6c02": "orange",
				"#e65100": "orange",
				"#e64a19": "red",
				"#f44336": "red",
				"#d32f2f": "red",
				"#757575": "gray",
			};
			for (const cal of items) {
				const color = cal.backgroundColor
					? colorMap[cal.backgroundColor.toLowerCase()] ?? "blue"
					: "blue";
				await ctx.runMutation(internal.calendarSync.addExternalCalendar, {
					connectionId,
					provider: "google",
					externalCalendarId: cal.id,
					name: cal.summary ?? cal.id,
					color,
				});
				try {
					await ctx.runAction(internal.googleCalendar.registerWatch, {
						connectionId,
						externalCalendarId: cal.id,
					});
				} catch (e) {
					console.warn("registerWatch failed for", cal.id, e);
				}
			}
		}

		return { connectionId };
	},
});

/** Refresh access token using refresh_token. */
async function refreshAccessToken(refreshToken: string): Promise<{
	access_token: string;
	expires_in: number;
}> {
	const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error("Google Calendar OAuth not configured");
	}
	const res = await fetch(GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			refresh_token: refreshToken,
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: "refresh_token",
		}),
	});
	if (!res.ok) {
		throw new Error(`Token refresh failed: ${await res.text()}`);
	}
	const data = (await res.json()) as { access_token: string; expires_in: number };
	return data;
}

/** Internal: sync one Google calendar (used by syncMyCalendars and webhook/cron). */
export const syncCalendar = internalAction({
	args: {
		connectionId: v.id("calendarConnections"),
		externalCalendarId: v.string(),
	},
	handler: async (ctx, args) => {
		const data = await ctx.runQuery(
			internal.calendarSync.getConnectionAndExternalCalendar,
			{
				connectionId: args.connectionId,
				externalCalendarId: args.externalCalendarId,
			}
		);
		if (!data) {
			throw new Error("Connection or calendar not found");
		}
		const { connection, externalCalendar } = data;
		let accessToken = connection.accessToken;
		let accessTokenExpiresAt = connection.accessTokenExpiresAt;
		const now = Date.now();
		if (
			!accessToken ||
			!accessTokenExpiresAt ||
			accessTokenExpiresAt < now + 60 * 1000
		) {
			const refreshed = await refreshAccessToken(connection.refreshToken);
			accessToken = refreshed.access_token;
			accessTokenExpiresAt = now + refreshed.expires_in * 1000;
			await ctx.runMutation(internal.calendarSync.updateConnectionTokens, {
				connectionId: args.connectionId,
				accessToken,
				accessTokenExpiresAt,
			});
		}

		const url = new URL(
			`${GOOGLE_EVENTS_URL}/${encodeURIComponent(args.externalCalendarId)}/events`
		);
		url.searchParams.set("singleEvents", "true");
		if (externalCalendar.syncToken) {
			url.searchParams.set("syncToken", externalCalendar.syncToken);
		} else {
			const timeMin = new Date();
			timeMin.setMonth(timeMin.getMonth() - 1);
			url.searchParams.set("timeMin", timeMin.toISOString());
		}

		const eventsRes = await fetch(url.toString(), {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		if (!eventsRes.ok) {
			if (eventsRes.status === 410) {
				await ctx.runMutation(
					internal.calendarSync.updateExternalCalendarSyncToken,
					{
						connectionId: args.connectionId,
						externalCalendarId: args.externalCalendarId,
						syncToken: "",
					}
				);
			}
			throw new Error(`Events list failed: ${await eventsRes.text()}`);
		}
		const eventsData = (await eventsRes.json()) as {
			items?: GoogleCalendarEvent[];
			nextSyncToken?: string;
		};
		const items = eventsData.items ?? [];
		const userId = connection.userId;
		const calendarId = externalCalendar.calendarId;

		// Get user email for computing isEditable
		const user = await ctx.runQuery(internal.users.getUserById, { userId });
		const userEmail = user?.email ?? "";

		for (const item of items) {
			if (item.status === "cancelled") {
				if (item.id) {
					await ctx.runMutation(
						internal.calendarSync.deleteEventByExternalId,
						{
							provider: "google",
							externalCalendarId: args.externalCalendarId,
							externalEventId: item.id,
						}
					);
				}
				continue;
			}
			if (!item.id) continue;
			const payload = googleEventToPayload(
				userId,
				calendarId ?? undefined,
				item,
				userEmail,
			);
			await ctx.runMutation(internal.calendarSync.upsertEventFromExternal, {
				provider: "google",
				externalCalendarId: args.externalCalendarId,
				externalEventId: payload.externalEventId,
				userId: payload.userId,
				calendarId: payload.calendarId,
				title: payload.title,
				description: payload.description,
				startTimestamp: payload.startTimestamp,
				endTimestamp: payload.endTimestamp,
				allDay: payload.allDay,
				startDateStr: payload.startDateStr,
				endDateStr: payload.endDateStr,
				startTime: payload.startTime,
				endTime: payload.endTime,
				timeZone: payload.timeZone,
				location: payload.location,
				color: payload.color,
				recurringEventId: payload.recurringEventId,
				creatorEmail: payload.creatorEmail,
				organizerEmail: payload.organizerEmail,
				guestsCanModify: payload.guestsCanModify,
				isEditable: payload.isEditable,
			});
		}

		if (eventsData.nextSyncToken) {
			await ctx.runMutation(
				internal.calendarSync.updateExternalCalendarSyncToken,
				{
					connectionId: args.connectionId,
					externalCalendarId: args.externalCalendarId,
					syncToken: eventsData.nextSyncToken,
				}
			);
		}
	},
});

/** Internal: register push watch for a calendar; store channelId/resourceId/expiration. */
export const registerWatch = internalAction({
	args: {
		connectionId: v.id("calendarConnections"),
		externalCalendarId: v.string(),
	},
	handler: async (ctx, args) => {
		const webhookUrl = process.env.GOOGLE_CALENDAR_WEBHOOK_URL;
		if (!webhookUrl) {
			throw new Error("GOOGLE_CALENDAR_WEBHOOK_URL not set");
		}
		const data = await ctx.runQuery(
			internal.calendarSync.getConnectionAndExternalCalendar,
			{
				connectionId: args.connectionId,
				externalCalendarId: args.externalCalendarId,
			}
		);
		if (!data) {
			throw new Error("Connection or calendar not found");
		}
		let accessToken = data.connection.accessToken;
		let accessTokenExpiresAt = data.connection.accessTokenExpiresAt;
		const now = Date.now();
		if (
			!accessToken ||
			!accessTokenExpiresAt ||
			accessTokenExpiresAt < now + 60 * 1000
		) {
			const refreshed = await refreshAccessToken(data.connection.refreshToken);
			accessToken = refreshed.access_token;
			accessTokenExpiresAt = now + refreshed.expires_in * 1000;
			await ctx.runMutation(internal.calendarSync.updateConnectionTokens, {
				connectionId: args.connectionId,
				accessToken,
				accessTokenExpiresAt,
			});
		}
		const channelId = crypto.randomUUID();
		const expirationMs = now + 7 * 24 * 60 * 60 * 1000; // 7 days (Google max)
		const watchRes = await fetch(
			`${GOOGLE_EVENTS_URL}/${encodeURIComponent(args.externalCalendarId)}/events/watch`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: channelId,
					type: "web_hook",
					address: webhookUrl,
					expiration: expirationMs,
				}),
			}
		);
		if (!watchRes.ok) {
			throw new Error(`events.watch failed: ${await watchRes.text()}`);
		}
		const watchData = (await watchRes.json()) as {
			id: string;
			resourceId: string;
			expiration?: string;
		};
		const expiration = watchData.expiration
			? new Date(watchData.expiration).getTime()
			: expirationMs;
		await ctx.runMutation(internal.calendarSync.updateExternalCalendarChannel, {
			connectionId: args.connectionId,
			externalCalendarId: args.externalCalendarId,
			channelId: watchData.id,
			resourceId: watchData.resourceId,
			expiration,
		});
	},
});

/** HTTP webhook: Google POSTs here on calendar changes; return 200 and schedule sync. */
export const googleCalendarWebhook = httpAction(async (ctx, request) => {
	const channelId = request.headers.get("X-Goog-Channel-ID");
	if (!channelId) {
		return new Response("Missing X-Goog-Channel-ID", { status: 400 });
	}
	const data = await ctx.runQuery(internal.calendarSync.getByChannelId, {
		channelId,
	});
	if (data) {
		await ctx.scheduler.runAfter(0, internal.googleCalendar.syncCalendar, {
			connectionId: data.connectionId,
			externalCalendarId: data.externalCalendarId,
		});
	}
	return new Response(null, { status: 200 });
});

/** Internal: renew watch channels that expire within 48h (for cron). */
export const renewExpiringChannels = internalAction({
	args: {},
	handler: async (ctx) => {
		const list = await ctx.runQuery(
			internal.calendarSync.getCalendarsNeedingChannelRenewal,
			{}
		);
		for (const { connectionId, externalCalendarId } of list) {
			try {
				await ctx.runAction(internal.googleCalendar.registerWatch, {
					connectionId,
					externalCalendarId,
				});
			} catch (e) {
				console.warn(
					"renewExpiringChannels failed",
					connectionId,
					externalCalendarId,
					e
				);
			}
		}
	},
});

/** Internal: run sync for all calendars (fallback for dropped push; for cron). */
export const runFallbackSync = internalAction({
	args: {},
	handler: async (ctx) => {
		const list = await ctx.runQuery(
			internal.calendarSync.getAllSyncedCalendars,
			{}
		);
		for (const { connectionId, externalCalendarId } of list) {
			try {
				await ctx.runAction(internal.googleCalendar.syncCalendar, {
					connectionId,
					externalCalendarId,
				});
			} catch (e) {
				console.warn(
					"runFallbackSync failed",
					connectionId,
					externalCalendarId,
					e
				);
			}
		}
	},
});

/** Internal: sync event updates back to Google Calendar API. */
export const syncEventToGoogle = internalAction({
	args: {
		eventId: v.id("events"),
		updates: v.object({
			title: v.optional(v.string()),
			description: v.optional(v.string()),
			startTimestamp: v.optional(v.number()),
			endTimestamp: v.optional(v.number()),
			location: v.optional(v.string()),
			allDay: v.optional(v.boolean()),
			startDateStr: v.optional(v.string()),
			endDateStr: v.optional(v.string()),
			startTime: v.optional(v.string()),
			endTime: v.optional(v.string()),
			timeZone: v.optional(v.string()),
		}),
		recurringEditMode: v.optional(v.union(v.literal("this"), v.literal("all"))),
		originalStartTimestamp: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// 1. Get event data
		const event = await ctx.runQuery(internal.events.getEventByIdInternal, {
			id: args.eventId,
		});
		if (
			!event ||
			event.externalProvider !== "google" ||
			!event.externalEventId ||
			!event.externalCalendarId
		) {
			return; // Not a Google Calendar event or missing required fields
		}

		// 2. Get connection via external calendar
		const externalCalendar = await ctx.runQuery(
			internal.calendarSync.getExternalCalendarByExternalId,
			{
				provider: "google",
				externalCalendarId: event.externalCalendarId,
			},
		);
		if (!externalCalendar) {
			throw new Error("External calendar not found");
		}

		const connectionData = await ctx.runQuery(
			internal.calendarSync.getConnectionAndExternalCalendar,
			{
				connectionId: externalCalendar.connectionId,
				externalCalendarId: event.externalCalendarId,
			},
		);
		if (!connectionData) {
			throw new Error("Connection not found");
		}

		const { connection } = connectionData;

		// 3. Refresh token if needed
		let accessToken = connection.accessToken;
		let accessTokenExpiresAt = connection.accessTokenExpiresAt;
		const now = Date.now();
		if (
			!accessToken ||
			!accessTokenExpiresAt ||
			accessTokenExpiresAt < now + 60 * 1000
		) {
			const refreshed = await refreshAccessToken(connection.refreshToken);
			accessToken = refreshed.access_token;
			accessTokenExpiresAt = now + refreshed.expires_in * 1000;
			await ctx.runMutation(internal.calendarSync.updateConnectionTokens, {
				connectionId: externalCalendar.connectionId,
				accessToken,
				accessTokenExpiresAt,
			});
		}

		// 4. Build Google Calendar API payload
		const finalStartTimestamp =
			args.updates.startTimestamp ?? event.startTimestamp;
		const finalEndTimestamp = args.updates.endTimestamp ?? event.endTimestamp;
		const finalAllDay = args.updates.allDay ?? event.allDay;

		const googlePayload: Record<string, unknown> = {
			summary: args.updates.title ?? event.title,
			description: args.updates.description ?? event.description ?? "",
			location: args.updates.location ?? event.location ?? "",
		};

		// Convert timestamps to Google dateTime/date format
		if (finalAllDay) {
			const startDateStr =
				args.updates.startDateStr ??
				event.startDateStr ??
				new Date(finalStartTimestamp).toISOString().slice(0, 10);
			const endDateStr =
				args.updates.endDateStr ??
				event.endDateStr ??
				new Date(finalEndTimestamp).toISOString().slice(0, 10);
			googlePayload.start = { date: startDateStr };
			googlePayload.end = { date: endDateStr };
		} else {
			const timeZone =
				args.updates.timeZone ?? event.timeZone ?? "UTC";
			const startDateTime = new Date(finalStartTimestamp).toISOString();
			const endDateTime = new Date(finalEndTimestamp).toISOString();
			googlePayload.start = {
				dateTime: startDateTime,
				timeZone,
			};
			googlePayload.end = {
				dateTime: endDateTime,
				timeZone,
			};
		}

		// 5. Determine API endpoint
		let url = `${GOOGLE_EVENTS_URL}/${encodeURIComponent(event.externalCalendarId)}/events/${encodeURIComponent(event.externalEventId)}`;

		// 6. For recurring events, add originalStartTime if editing single instance
		if (event.recurringEventId && args.recurringEditMode === "this") {
			// Use the original startTimestamp (before update) if provided, otherwise use current
			const originalStartTime = args.originalStartTimestamp
				? new Date(args.originalStartTimestamp).toISOString()
				: new Date(event.startTimestamp).toISOString();
			url += `?originalStartTime=${encodeURIComponent(originalStartTime)}`;
		}

		// 7. PATCH to Google Calendar API
		const res = await fetch(url, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(googlePayload),
		});

		if (!res.ok) {
			const errorText = await res.text();
			throw new Error(`Google Calendar sync failed: ${errorText}`);
		}
	},
});

/** Public: sync all Google calendars for the current user (e.g. "Sync now" button). */
export const syncMyCalendars = action({
	args: {},
	handler: async (ctx) => {
		const userId = await ctx.runQuery(api.users.getCurrentUserId);
		if (!userId) {
			throw new Error("Not authenticated");
		}
		const data = await ctx.runQuery(
			internal.googleCalendar.getConnectionByUserId,
			{ userId }
		);
		if (!data) {
			return; // No Google connection
		}
		for (const externalCalendarId of data.externalCalendarIds) {
			await ctx.runAction(internal.googleCalendar.syncCalendar, {
				connectionId: data.connectionId,
				externalCalendarId,
			});
		}
	},
});
