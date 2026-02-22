import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { internal } from "../_generated/api";
import { ErrorCode, throwConvexError } from "../errors";
import { authMutation } from "../helpers";

const taskLinkSchema = z.object({
	externalTaskId: z.string(),
	url: z.string(),
});

const createEventArgs = z.object({
	title: z.string(),
	description: z.string().optional(),
	startTimestamp: z.number().optional(),
	endTimestamp: z.number().optional(),
	calendarId: zid("calendars").optional(),
	color: z.string().optional(),
	location: z.string().optional(),
	allDay: z.boolean(),
	startDateStr: z.string().optional(),
	endDateStr: z.string().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	timeZone: z.string().optional(),
	busy: z.enum(["busy", "free", "tentative", "outOfOffice"]).optional(),
	visibility: z.enum(["public", "private"]).optional(),
	eventKind: z.enum(["event", "task"]).optional(),
	scheduledTaskLinks: z.array(taskLinkSchema).optional(),
	relatedTaskLinks: z.array(taskLinkSchema).optional(),
	recurrence: z.array(z.string()).optional(),
});

export const createEvent = authMutation({
	args: createEventArgs,
	handler: async (ctx, args) => {
		let derivedStartTimestamp = args.startTimestamp;
		let derivedEndTimestamp = args.endTimestamp;

		if (
			derivedStartTimestamp === undefined ||
			derivedEndTimestamp === undefined
		) {
			if (args.allDay && args.startDateStr && args.endDateStr) {
				const startDateObj = new Date(args.startDateStr + "T00:00:00Z");
				const endDateObj = new Date(args.endDateStr + "T00:00:00Z");
				derivedStartTimestamp = startDateObj.getTime();
				derivedEndTimestamp = endDateObj.getTime();
			} else {
				throwConvexError(
					ErrorCode.BAD_REQUEST,
					"Must provide startTimestamp/endTimestamp for timed events, or startDateStr/endDateStr for all-day events",
				);
			}
		}

		if (derivedEndTimestamp < derivedStartTimestamp) {
			throwConvexError(
				ErrorCode.BAD_REQUEST,
				"End date must be after start date",
			);
		}

		const eventKind = args.eventKind ?? "event";
		const scheduledTaskLinks = args.scheduledTaskLinks ?? [];

		const {
			scheduledTaskLinks: _scheduledTaskLinks,
			relatedTaskLinks: _relatedTaskLinks,
			...eventArgs
		} = args;
		const eventId = await ctx.db.insert("events", {
			...eventArgs,
			startTimestamp: derivedStartTimestamp,
			endTimestamp: derivedEndTimestamp,
			userId: ctx.user._id,
			busy: args.busy ?? "free",
			visibility: args.visibility ?? "public",
			eventKind,
		});

		const seenScheduled = new Set<string>();
		for (const link of scheduledTaskLinks) {
			if (seenScheduled.has(link.externalTaskId)) continue;
			seenScheduled.add(link.externalTaskId);
			await ctx.db.insert("eventTaskLinks", {
				eventId,
				userId: ctx.user._id,
				externalTaskId: link.externalTaskId,
				provider: "linear",
				url: link.url,
				linkType: "scheduled",
			});
		}

		const relatedTaskLinks = args.relatedTaskLinks ?? [];
		const seenRelated = new Set<string>();
		for (const link of relatedTaskLinks) {
			if (seenRelated.has(link.externalTaskId)) continue;
			if (seenScheduled.has(link.externalTaskId)) continue;
			seenRelated.add(link.externalTaskId);
			await ctx.db.insert("eventTaskLinks", {
				eventId,
				userId: ctx.user._id,
				externalTaskId: link.externalTaskId,
				provider: "linear",
				url: link.url,
				linkType: "related",
			});
		}

		if (args.calendarId) {
			const ext = await ctx.db
				.query("externalCalendars")
				.withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
				.unique();
			if (ext?.provider === "google") {
				await ctx.scheduler.runAfter(
					0,
					internal.googleCalendar.actionsNode.createEventInGoogle,
					{ eventId },
				);
			}
		}

		const doc = await ctx.db.get("events", eventId);
		if (!doc) {
			throwConvexError(
				ErrorCode.INTERNAL,
				"Event was created but could not be read back",
			);
		}
		return doc;
	},
});

const updateEventArgs = z.object({
	id: zid("events"),
	title: z.string().optional(),
	description: z.string().optional(),
	startTimestamp: z.number().optional(),
	endTimestamp: z.number().optional(),
	calendarId: zid("calendars").optional(),
	color: z.string().optional(),
	location: z.string().optional(),
	allDay: z.boolean().optional(),
	startDateStr: z.string().optional(),
	endDateStr: z.string().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	timeZone: z.string().optional(),
	recurringEditMode: z.enum(["this", "all"]).optional(),
	busy: z.enum(["busy", "free", "tentative", "outOfOffice"]).optional(),
	visibility: z.enum(["public", "private"]).optional(),
	eventKind: z.enum(["event", "task"]).optional(),
	scheduledTaskLinks: z.array(taskLinkSchema).optional(),
	relatedTaskLinks: z.array(taskLinkSchema).optional(),
	clearColor: z.boolean().optional(),
});

export const updateEvent = authMutation({
	args: updateEventArgs,
	handler: async (ctx, args) => {
		const {
			id,
			recurringEditMode,
			scheduledTaskLinks,
			relatedTaskLinks,
			clearColor,
			...updates
		} = args;
		const event = await ctx.db.get("events", id);

		if (!event) {
			throwConvexError(ErrorCode.EVENT_NOT_FOUND, "Event not found");
		}
		if (event.userId !== ctx.user._id) {
			throwConvexError(
				ErrorCode.NOT_AUTHORIZED,
				"Not authorized to update this event",
			);
		}

		if (event.externalProvider === "google" && event.isEditable === false) {
			throwConvexError(
				ErrorCode.EVENT_CANNOT_BE_EDITED,
				"This event cannot be edited. It was created by someone else.",
			);
		}

		const allDay = updates.allDay ?? event.allDay;

		const derived = (() => {
			const hasDateOrTimeUpdates =
				updates.startDateStr ||
				updates.endDateStr ||
				updates.startTime ||
				updates.endTime ||
				updates.timeZone;
			if (!hasDateOrTimeUpdates) {
				return {
					start: updates.startTimestamp,
					end: updates.endTimestamp,
				};
			}
			const startDateStr = updates.startDateStr ?? event.startDateStr;
			const endDateStr = updates.endDateStr ?? event.endDateStr;
			const startTime = updates.startTime ?? event.startTime;
			const endTime = updates.endTime ?? event.endTime;
			const timeZone = updates.timeZone ?? event.timeZone;
			if (allDay && startDateStr && endDateStr) {
				return {
					start: new Date(startDateStr + "T00:00:00Z").getTime(),
					end: new Date(endDateStr + "T00:00:00Z").getTime(),
				};
			}
			if (
				!allDay &&
				startDateStr &&
				startTime &&
				endDateStr &&
				endTime &&
				timeZone
			) {
				return {
					start: new Date(`${startDateStr}T${startTime}:00Z`).getTime(),
					end: new Date(`${endDateStr}T${endTime}:00Z`).getTime(),
				};
			}
			return {
				start: updates.startTimestamp,
				end: updates.endTimestamp,
			};
		})();

		const newStartTimestamp =
			derived.start ?? updates.startTimestamp ?? event.startTimestamp;
		const newEndTimestamp =
			derived.end ?? updates.endTimestamp ?? event.endTimestamp;

		if (newEndTimestamp < newStartTimestamp) {
			throwConvexError(
				ErrorCode.BAD_REQUEST,
				"End date must be after start date",
			);
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined),
		);

		if (derived.start !== undefined) {
			cleanUpdates.startTimestamp = derived.start;
		}
		if (derived.end !== undefined) {
			cleanUpdates.endTimestamp = derived.end;
		}
		if (clearColor === true) {
			(cleanUpdates as Record<string, unknown>).color = undefined;
		}

		if (allDay) {
			(cleanUpdates as Record<string, unknown>).startTime = undefined;
			(cleanUpdates as Record<string, unknown>).endTime = undefined;
			(cleanUpdates as Record<string, unknown>).timeZone = undefined;
		}

		const hasGoogleIds =
			event.externalProvider === "google" &&
			event.externalEventId &&
			event.externalCalendarId;
		const convertingSyncedToTask =
			hasGoogleIds &&
			(args.eventKind === "task" || cleanUpdates.eventKind === "task");

		const applyTaskLinkUpdates = async () => {
			if (scheduledTaskLinks !== undefined) {
				const existing = await ctx.db
					.query("eventTaskLinks")
					.withIndex("by_event", (q) => q.eq("eventId", id))
					.collect();
				for (const link of existing) {
					if (link.linkType === "scheduled") {
						await ctx.db.delete("eventTaskLinks", link._id);
					}
				}
				const seen = new Set<string>();
				for (const link of scheduledTaskLinks) {
					if (seen.has(link.externalTaskId)) continue;
					seen.add(link.externalTaskId);
					await ctx.db.insert("eventTaskLinks", {
						eventId: id,
						userId: event.userId,
						externalTaskId: link.externalTaskId,
						provider: "linear",
						url: link.url,
						linkType: "scheduled",
					});
				}
			}
			if (relatedTaskLinks !== undefined) {
				const existing = await ctx.db
					.query("eventTaskLinks")
					.withIndex("by_event", (q) => q.eq("eventId", id))
					.collect();
				for (const link of existing) {
					if (link.linkType === "related") {
						await ctx.db.delete("eventTaskLinks", link._id);
					}
				}
				const seen = new Set<string>();
				for (const link of relatedTaskLinks) {
					if (seen.has(link.externalTaskId)) continue;
					seen.add(link.externalTaskId);
					await ctx.db.insert("eventTaskLinks", {
						eventId: id,
						userId: event.userId,
						externalTaskId: link.externalTaskId,
						provider: "linear",
						url: link.url,
						linkType: "related",
					});
				}
			}
		};

		if (convertingSyncedToTask) {
			const externalCalendars = await ctx.db
				.query("externalCalendars")
				.collect();
			const ext = externalCalendars.find(
				(e) =>
					e.provider === "google" &&
					e.externalCalendarId === event.externalCalendarId,
			);
			if (ext) {
				await ctx.scheduler.runAfter(
					0,
					internal.googleCalendar.actionsNode.deleteEventFromGoogle,
					{
						connectionId: ext.connectionId,
						externalCalendarId: event.externalCalendarId as string,
						externalEventId: event.externalEventId as string,
					},
				);
			}
			Object.assign(cleanUpdates, {
				eventKind: "task",
				busy: "busy",
				externalProvider: undefined,
				externalCalendarId: undefined,
				externalEventId: undefined,
			});
			await applyTaskLinkUpdates();
			await ctx.db.patch("events", id, cleanUpdates);
			const doc = await ctx.db.get("events", id);
			if (!doc) {
				throwConvexError(
					ErrorCode.INTERNAL,
					"Event was updated but could not be read back",
				);
			}
			return doc;
		}

		const willSyncToGoogle =
			event.externalProvider === "google" &&
			event.isEditable === true &&
			event.externalEventId &&
			event.externalCalendarId;

		console.log(
			"[updateEvent] eventId=%s externalProvider=%s isEditable=%s hasExternalIds=%s willSyncToGoogle=%s",
			id,
			event.externalProvider,
			event.isEditable,
			Boolean(event.externalEventId && event.externalCalendarId),
			willSyncToGoogle,
		);

		if (willSyncToGoogle) {
			const originalStartTimestamp =
				event.recurringEventId && recurringEditMode === "this"
					? event.startTimestamp
					: undefined;
			console.log(
				"[updateEvent] scheduling syncEventToGoogle for eventId=%s",
				id,
			);
			await ctx.scheduler.runAfter(
				0,
				internal.googleCalendar.actionsNode.syncEventToGoogle,
				{
					eventId: id,
					updates: cleanUpdates,
					recurringEditMode,
					originalStartTimestamp,
				},
			);
		}

		if (!willSyncToGoogle) {
			const effectiveCalendarId = updates.calendarId ?? event.calendarId;
			if (effectiveCalendarId) {
				const ext = await ctx.db
					.query("externalCalendars")
					.withIndex("by_calendar", (q) =>
						q.eq("calendarId", effectiveCalendarId),
					)
					.unique();
				if (ext?.provider === "google") {
					console.log(
						"[updateEvent] scheduling createEventInGoogle for eventId=%s",
						id,
					);
					await ctx.scheduler.runAfter(
						0,
						internal.googleCalendar.actionsNode.createEventInGoogle,
						{ eventId: id },
					);
				}
			}
		}

		await applyTaskLinkUpdates();
		await ctx.db.patch("events", id, cleanUpdates);
		const doc = await ctx.db.get("events", id);
		if (!doc) {
			throwConvexError(
				ErrorCode.INTERNAL,
				"Event was updated but could not be read back",
			);
		}
		return doc;
	},
});

export const deleteEvent = authMutation({
	args: z.object({
		id: zid("events"),
	}),
	handler: async (ctx, args) => {
		const event = await ctx.db.get("events", args.id);

		if (!event) {
			throwConvexError(ErrorCode.EVENT_NOT_FOUND, "Event not found");
		}
		if (event.userId !== ctx.user._id) {
			throwConvexError(
				ErrorCode.NOT_AUTHORIZED,
				"Not authorized to delete this event",
			);
		}

		const externalProvider = event.externalProvider;
		const externalEventId = event.externalEventId;
		const externalCalendarId = event.externalCalendarId;

		const links = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_event", (q) => q.eq("eventId", args.id))
			.collect();
		for (const link of links) {
			await ctx.db.delete("eventTaskLinks", link._id);
		}

		await ctx.db.delete("events", args.id);

		if (
			externalProvider === "google" &&
			externalEventId &&
			externalCalendarId
		) {
			const externalCalendars = await ctx.db
				.query("externalCalendars")
				.collect();
			const ext = externalCalendars.find(
				(e) =>
					e.provider === "google" &&
					e.externalCalendarId === externalCalendarId,
			);
			if (ext) {
				await ctx.scheduler.runAfter(
					0,
					internal.googleCalendar.actionsNode.deleteEventFromGoogle,
					{
						connectionId: ext.connectionId,
						externalCalendarId,
						externalEventId,
					},
				);
			}
		}
	},
});
