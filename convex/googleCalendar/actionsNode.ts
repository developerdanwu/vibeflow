"use node";

import { calendar, type calendar_v3 } from "@googleapis/calendar";
import { v } from "convex/values";
import { OAuth2Client } from "google-auth-library";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, internalAction } from "../_generated/server";
import { ErrorCode, throwConvexError } from "../errors";
import { authAction } from "../helpers";

function getOAuth2Client(redirectUri?: string): OAuth2Client {
	const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throwConvexError(
			ErrorCode.OAUTH_NOT_CONFIGURED,
			"Google Calendar OAuth not configured",
		);
	}
	return new OAuth2Client(
		clientId,
		clientSecret,
		redirectUri ?? "http://localhost",
	);
}

function getAuthenticatedCalendarClient(
	accessToken: string,
): calendar_v3.Calendar {
	const oauth2 = getOAuth2Client();
	oauth2.setCredentials({ access_token: accessToken });
	return calendar({ version: "v3", auth: oauth2 });
}

async function refreshAccessTokenWithOAuth2(refreshToken: string): Promise<{
	access_token: string;
	accessTokenExpiresAt: number;
}> {
	const oauth2 = getOAuth2Client();
	oauth2.setCredentials({ refresh_token: refreshToken });
	await oauth2.getAccessToken();
	const creds = oauth2.credentials;
	const expiryDate = creds.expiry_date;
	if (!creds.access_token || expiryDate == null) {
		throwConvexError(
			ErrorCode.TOKEN_REFRESH_FAILED,
			"Token refresh failed: no access token or expiry",
		);
	}
	return {
		access_token: creds.access_token,
		accessTokenExpiresAt: expiryDate,
	};
}

type StatePayload = {
	userId: string;
	returnTo: string;
	redirectUri: string;
	provider?: "google" | "microsoft";
};

function decodeState(state: string): StatePayload {
	try {
		const decoded = atob(state.replace(/-/g, "+").replace(/_/g, "/"));
		return JSON.parse(decoded) as StatePayload;
	} catch {
		throwConvexError(ErrorCode.INVALID_STATE, "Invalid state parameter");
	}
}

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
	item: calendar_v3.Schema$Event,
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
	const creatorEmail = item.creator?.email ?? undefined;
	const organizerEmail = item.organizer?.email ?? undefined;
	const guestsCanModify = item.guestsCanModify ?? undefined;
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
		description: item.description ?? undefined,
		startTimestamp: start,
		endTimestamp: end,
		allDay,
		startDateStr,
		endDateStr,
		startTime,
		endTime,
		timeZone: tz ?? undefined,
		location: item.location ?? undefined,
		color: undefined,
		recurringEventId: item.recurringEventId ?? undefined,
		creatorEmail,
		organizerEmail,
		guestsCanModify,
		isEditable,
	};
}

/** Refresh access token using refresh_token (via OAuth2Client). */
async function refreshAccessToken(refreshToken: string): Promise<{
	access_token: string;
	expires_in: number;
}> {
	const { access_token, accessTokenExpiresAt } =
		await refreshAccessTokenWithOAuth2(refreshToken);
	const expires_in = Math.round((accessTokenExpiresAt - Date.now()) / 1000);
	return { access_token, expires_in };
}

/** Exchange OAuth code for tokens, store connection, fetch and store calendar list. */
export const exchangeCode = action({
	args: {
		code: v.string(),
		state: v.string(),
	},
	handler: async (
		ctx,
		args,
	): Promise<{ connectionId: Id<"calendarConnections">; returnTo: string }> => {
		const { userId: userIdStr, redirectUri, returnTo } =
			decodeState(args.state);
		const userId = userIdStr as Id<"users">;

		const oauth2 = getOAuth2Client(redirectUri);
		const { tokens } = await oauth2.getToken(args.code);
		if (!tokens.refresh_token) {
			throwConvexError(ErrorCode.NO_REFRESH_TOKEN, "No refresh token returned");
		}
		const accessTokenExpiresAt = tokens.expiry_date ?? undefined;

		const connectionId = (await ctx.runMutation(
			internal.googleCalendar.mutations.saveConnection,
			{
				provider: "google",
				userId,
				refreshToken: tokens.refresh_token,
				accessToken: tokens.access_token ?? "",
				accessTokenExpiresAt,
			},
		)) as Id<"calendarConnections">;

		// Fetch calendar list via client and add each as external calendar + Convex calendar
		oauth2.setCredentials(tokens);
		const calendarClient = calendar({ version: "v3", auth: oauth2 });
		const listRes = await calendarClient.calendarList.list();
		const items = listRes.data.items ?? [];
		if (items.length > 0) {
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
				const calId = cal.id ?? "";
				const color = cal.backgroundColor
					? (colorMap[cal.backgroundColor.toLowerCase()] ?? "blue")
					: "blue";
				await ctx.runMutation(
					internal.googleCalendar.mutations.addExternalCalendar,
					{
						connectionId,
						provider: "google",
						externalCalendarId: calId,
						name: cal.summary ?? calId,
						color,
					},
				);
				try {
					await ctx.runAction(
						internal.googleCalendar.actionsNode.registerWatch,
						{
							connectionId,
							externalCalendarId: calId,
						},
					);
				} catch (e) {
					console.warn("registerWatch failed for", calId, e);
				}
			}
		}

		return { connectionId, returnTo };
	},
});

/** Internal: sync one Google calendar (used by syncMyCalendars and webhook/cron). */
export const syncCalendar = internalAction({
	args: {
		connectionId: v.id("calendarConnections"),
		externalCalendarId: v.string(),
	},
	handler: async (ctx, args) => {
		const data = await ctx.runQuery(
			internal.googleCalendar.queries.getConnectionAndExternalCalendar,
			{
				connectionId: args.connectionId,
				externalCalendarId: args.externalCalendarId,
			},
		);
		if (!data) {
			throwConvexError(
				ErrorCode.CONNECTION_NOT_FOUND,
				"Connection or calendar not found",
			);
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
			await ctx.runMutation(
				internal.googleCalendar.mutations.updateConnectionTokens,
				{
					connectionId: args.connectionId,
					accessToken,
					accessTokenExpiresAt,
				},
			);
		}

		const userId = connection.userId;
		const calendarId = externalCalendar.calendarId;

		const calendarClient = getAuthenticatedCalendarClient(accessToken);
		let timeMin: string | undefined;
		if (!externalCalendar.syncToken) {
			const prefs = await ctx.runQuery(
				internal.users.queries.getUserPreferencesByUserId,
				{ userId: connection.userId },
			);
			const months = prefs?.calendarSyncFromMonths ?? 1;
			const capped = Math.min(Math.max(1, months), 24);
			const minDate = new Date();
			minDate.setMonth(minDate.getMonth() - capped);
			timeMin = minDate.toISOString();
		}

		const allItems: calendar_v3.Schema$Event[] = [];
		let lastNextSyncToken: string | undefined;
		let pageToken: string | undefined;

		try {
			do {
				const listParams: calendar_v3.Params$Resource$Events$List = {
					calendarId: args.externalCalendarId,
					singleEvents: true,
					pageToken,
				};
				if (externalCalendar.syncToken) {
					listParams.syncToken = externalCalendar.syncToken;
				} else {
					listParams.timeMin = timeMin;
				}
				const eventsRes = await calendarClient.events.list(listParams);
				const data = eventsRes.data;
				allItems.push(...(data.items ?? []));
				lastNextSyncToken = data.nextSyncToken ?? undefined;
				pageToken = data.nextPageToken ?? undefined;
			} while (pageToken);
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			if (status === 410) {
				console.warn(
					"Sync token expired (410), clearing and scheduling full re-sync",
					args.connectionId,
					args.externalCalendarId,
				);
				await ctx.runMutation(
					internal.googleCalendar.mutations.updateExternalCalendarSyncToken,
					{
						connectionId: args.connectionId,
						externalCalendarId: args.externalCalendarId,
						syncToken: "",
					},
				);
				await ctx.scheduler.runAfter(
					0,
					internal.googleCalendar.actionsNode.syncCalendar,
					{
						connectionId: args.connectionId,
						externalCalendarId: args.externalCalendarId,
					},
				);
				return;
			}
			throw err;
		}

		// Get user email for computing isEditable
		const user = await ctx.runQuery(internal.users.queries.getUserById, {
			userId,
		});
		const userEmail = user?.email ?? "";

		const BATCH_SIZE = 100;
		const toDelete: {
			provider: "google";
			externalCalendarId: string;
			externalEventId: string;
		}[] = [];
		const toUpsert: {
			provider: "google";
			externalCalendarId: string;
			externalEventId: string;
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
		}[] = [];

		for (const item of allItems) {
			if (item.status === "cancelled") {
				if (item.id) {
					toDelete.push({
						provider: "google",
						externalCalendarId: args.externalCalendarId,
						externalEventId: item.id,
					});
				}
				continue;
			}
			if (!item.id) {
				console.warn("[googleCalendar] Event missing id, skipping", {
					summary: item.summary,
					status: item.status,
					recurringEventId: item.recurringEventId,
					externalCalendarId: args.externalCalendarId,
				});
				continue;
			}
			const payload = googleEventToPayload(
				userId,
				calendarId ?? undefined,
				item,
				userEmail,
			);
			toUpsert.push({
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

		for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
			const chunk = toDelete.slice(i, i + BATCH_SIZE);
			await ctx.runMutation(
				internal.googleCalendar.mutations.deleteEventsByExternalIdBatch,
				{ deletes: chunk },
			);
		}
		for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
			const chunk = toUpsert.slice(i, i + BATCH_SIZE);
			await ctx.runMutation(
				internal.googleCalendar.mutations.upsertEventsFromExternalBatch,
				{ events: chunk },
			);
		}

		if (lastNextSyncToken) {
			await ctx.runMutation(
				internal.googleCalendar.mutations.updateExternalCalendarSyncToken,
				{
					connectionId: args.connectionId,
					externalCalendarId: args.externalCalendarId,
					syncToken: lastNextSyncToken,
				},
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
			throwConvexError(
				ErrorCode.WEBHOOK_URL_NOT_SET,
				"GOOGLE_CALENDAR_WEBHOOK_URL not set",
			);
		}
		const data = await ctx.runQuery(
			internal.googleCalendar.queries.getConnectionAndExternalCalendar,
			{
				connectionId: args.connectionId,
				externalCalendarId: args.externalCalendarId,
			},
		);
		if (!data) {
			throwConvexError(
				ErrorCode.CONNECTION_NOT_FOUND,
				"Connection or calendar not found",
			);
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
			await ctx.runMutation(
				internal.googleCalendar.mutations.updateConnectionTokens,
				{
					connectionId: args.connectionId,
					accessToken,
					accessTokenExpiresAt,
				},
			);
		}
		const channelId = crypto.randomUUID();
		const expirationMs = now + 7 * 24 * 60 * 60 * 1000; // 7 days (Google max)
		const calendarClient = getAuthenticatedCalendarClient(accessToken);
		const watchRes = await calendarClient.events.watch({
			calendarId: args.externalCalendarId,
			requestBody: {
				id: channelId,
				type: "web_hook",
				address: webhookUrl,
				expiration: String(expirationMs),
			},
		});
		const watchData = watchRes.data;
		const expiration = watchData.expiration
			? new Date(Number(watchData.expiration)).getTime()
			: expirationMs;
		await ctx.runMutation(
			internal.googleCalendar.mutations.updateExternalCalendarChannel,
			{
				connectionId: args.connectionId,
				externalCalendarId: args.externalCalendarId,
				channelId: watchData.id ?? channelId,
				resourceId: watchData.resourceId ?? "",
				expiration,
			},
		);
	},
});

/** Internal: renew watch channels that expire within 48h (for cron). */
export const renewExpiringChannels = internalAction({
	args: {},
	handler: async (ctx) => {
		const list = await ctx.runQuery(
			internal.googleCalendar.queries.getCalendarsNeedingChannelRenewal,
			{},
		);
		for (const { connectionId, externalCalendarId } of list) {
			try {
				await ctx.runAction(internal.googleCalendar.actionsNode.registerWatch, {
					connectionId,
					externalCalendarId,
				});
			} catch (e) {
				console.warn(
					"renewExpiringChannels failed",
					connectionId,
					externalCalendarId,
					e,
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
			internal.googleCalendar.queries.getAllSyncedCalendars,
			{},
		);
		for (const { connectionId, externalCalendarId } of list) {
			try {
				await ctx.runAction(internal.googleCalendar.actionsNode.syncCalendar, {
					connectionId,
					externalCalendarId,
				});
			} catch (e) {
				console.warn(
					"runFallbackSync failed",
					connectionId,
					externalCalendarId,
					e,
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
		console.log("[syncEventToGoogle] started eventId=%s", args.eventId);
		// 1. Get event data
		const event = await ctx.runQuery(
			internal.events.queries.getEventByIdInternal,
			{
				id: args.eventId,
			},
		);
		if (!event) {
			console.log("[syncEventToGoogle] skipped: event not found");
			return;
		}
		if (
			event.externalProvider !== "google" ||
			!event.externalEventId ||
			!event.externalCalendarId
		) {
			console.log(
				"[syncEventToGoogle] skipped: not a Google event or missing external ids provider=%s externalEventId=%s externalCalendarId=%s",
				event.externalProvider,
				event.externalEventId ?? "(none)",
				event.externalCalendarId ?? "(none)",
			);
			return;
		}

		// 2. Get connection via external calendar
		const externalCalendar = await ctx.runQuery(
			internal.googleCalendar.queries.getExternalCalendarByExternalId,
			{
				provider: "google",
				externalCalendarId: event.externalCalendarId,
			},
		);
		if (!externalCalendar) {
			throwConvexError(
				ErrorCode.EXTERNAL_CALENDAR_NOT_FOUND,
				"External calendar not found",
			);
		}

		const connectionData = await ctx.runQuery(
			internal.googleCalendar.queries.getConnectionAndExternalCalendar,
			{
				connectionId: externalCalendar.connectionId,
				externalCalendarId: event.externalCalendarId,
			},
		);
		if (!connectionData) {
			throwConvexError(ErrorCode.CONNECTION_NOT_FOUND, "Connection not found");
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
			await ctx.runMutation(
				internal.googleCalendar.mutations.updateConnectionTokens,
				{
					connectionId: externalCalendar.connectionId,
					accessToken,
					accessTokenExpiresAt,
				},
			);
		}

		// 4. Build Google Calendar API payload (single object with spread; type via satisfies)
		const finalStartTimestamp =
			args.updates.startTimestamp ?? event.startTimestamp;
		const finalEndTimestamp = args.updates.endTimestamp ?? event.endTimestamp;
		const finalAllDay = args.updates.allDay ?? event.allDay;

		const timeZone = args.updates.timeZone ?? event.timeZone ?? "UTC";
		const startIso = new Date(finalStartTimestamp).toISOString();
		const endIso = new Date(finalEndTimestamp).toISOString();
		const googlePayload = {
			summary: args.updates.title ?? event.title,
			description: args.updates.description ?? event.description ?? "",
			location: args.updates.location ?? event.location ?? "",
			...(finalAllDay
				? {
						start: {
							date:
								args.updates.startDateStr ??
								event.startDateStr ??
								startIso.slice(0, 10),
						},
						end: {
							date:
								args.updates.endDateStr ??
								event.endDateStr ??
								endIso.slice(0, 10),
						},
					}
				: {
						start: { dateTime: startIso, timeZone },
						end: { dateTime: endIso, timeZone },
					}),
		} satisfies calendar_v3.Schema$Event;

		// 5. PATCH via calendar client (params built with spread; type via satisfies)
		const calendarClient = getAuthenticatedCalendarClient(accessToken);
		const patchParams = {
			calendarId: event.externalCalendarId,
			eventId: event.externalEventId,
			requestBody: googlePayload,
			...(event.recurringEventId && args.recurringEditMode === "this"
				? {
						originalStartTime:
							args.originalStartTimestamp != null
								? new Date(args.originalStartTimestamp).toISOString()
								: new Date(event.startTimestamp).toISOString(),
					}
				: {}),
		} satisfies calendar_v3.Params$Resource$Events$Patch & {
			originalStartTime?: string;
		};
		await calendarClient.events.patch(patchParams);
		console.log(
			"[syncEventToGoogle] completed eventId=%s externalEventId=%s",
			args.eventId,
			event.externalEventId,
		);
	},
});

/** Internal: create a locally-created event in Google Calendar and patch the event with external ids. */
export const createEventInGoogle = internalAction({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		const event = await ctx.runQuery(
			internal.events.queries.getEventByIdInternal,
			{
				id: args.eventId,
			},
		);
		if (!event?.calendarId) {
			return;
		}
		const externalCalendar = await ctx.runQuery(
			internal.googleCalendar.queries.getExternalCalendarByCalendarId,
			{ calendarId: event.calendarId },
		);
		if (!externalCalendar || externalCalendar.provider !== "google") {
			return;
		}
		const connectionData = await ctx.runQuery(
			internal.googleCalendar.queries.getConnectionAndExternalCalendar,
			{
				connectionId: externalCalendar.connectionId,
				externalCalendarId: externalCalendar.externalCalendarId,
			},
		);
		if (!connectionData) {
			throwConvexError(ErrorCode.CONNECTION_NOT_FOUND, "Connection not found");
		}
		const { connection } = connectionData;
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
			await ctx.runMutation(
				internal.googleCalendar.mutations.updateConnectionTokens,
				{
					connectionId: externalCalendar.connectionId,
					accessToken,
					accessTokenExpiresAt,
				},
			);
		}
		const timeZone = event.timeZone ?? "UTC";
		const startIso = new Date(event.startTimestamp).toISOString();
		const endIso = new Date(event.endTimestamp).toISOString();
		const googlePayload = {
			summary: event.title,
			description: event.description ?? "",
			location: event.location ?? "",
			...(event.allDay
				? {
						start: {
							date: event.startDateStr ?? startIso.slice(0, 10),
						},
						end: {
							date: event.endDateStr ?? endIso.slice(0, 10),
						},
					}
				: {
						start: { dateTime: startIso, timeZone },
						end: { dateTime: endIso, timeZone },
					}),
		} satisfies calendar_v3.Schema$Event;
		const calendarClient = getAuthenticatedCalendarClient(accessToken);
		const insertRes = await calendarClient.events.insert({
			calendarId: externalCalendar.externalCalendarId,
			requestBody: googlePayload,
		});
		const externalEventId = insertRes.data.id;
		if (!externalEventId) {
			throwConvexError(
				ErrorCode.GOOGLE_INSERT_NO_EVENT_ID,
				"Google Calendar insert did not return event id",
			);
		}
		await ctx.runMutation(
			internal.googleCalendar.mutations.patchEventExternalFields,
			{
				eventId: args.eventId,
				externalProvider: "google",
				externalCalendarId: externalCalendar.externalCalendarId,
				externalEventId,
				isEditable: true,
			},
		);
	},
});

/** Internal: delete an event from Google Calendar (call after local event is deleted). */
export const deleteEventFromGoogle = internalAction({
	args: {
		connectionId: v.id("calendarConnections"),
		externalCalendarId: v.string(),
		externalEventId: v.string(),
	},
	handler: async (ctx, args) => {
		const connectionData = await ctx.runQuery(
			internal.googleCalendar.queries.getConnectionAndExternalCalendar,
			{
				connectionId: args.connectionId,
				externalCalendarId: args.externalCalendarId,
			},
		);
		if (!connectionData) {
			return;
		}
		const { connection } = connectionData;
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
			await ctx.runMutation(
				internal.googleCalendar.mutations.updateConnectionTokens,
				{
					connectionId: args.connectionId,
					accessToken,
					accessTokenExpiresAt,
				},
			);
		}
		const calendarClient = getAuthenticatedCalendarClient(accessToken);
		try {
			await calendarClient.events.delete({
				calendarId: args.externalCalendarId,
				eventId: args.externalEventId,
			});
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response
				?.status;
			if (status === 404 || status === 410) {
				return;
			}
			throw err;
		}
	},
});

/** Public: sync all Google calendars for the current user (e.g. "Sync now" button). */
export const syncMyCalendars = authAction({
	args: {},
	handler: async (ctx) => {
		const data = await ctx.runQuery(
			internal.googleCalendar.queries.getConnectionByUserId,
			{ userId: ctx.user._id },
		);
		if (!data) {
			return; // No Google connection
		}
		for (const externalCalendarId of data.externalCalendarIds) {
			await ctx.runAction(internal.googleCalendar.actionsNode.syncCalendar, {
				connectionId: data.connectionId,
				externalCalendarId,
			});
		}
	},
});
