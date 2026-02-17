import { v } from "convex/values";
import { authMutation } from "../helpers";
import { internal } from "../_generated/api";

export const createEvent = authMutation({
	args: {
		title: v.string(),
		description: v.optional(v.string()),
		startTimestamp: v.optional(v.number()),
		endTimestamp: v.optional(v.number()),
		calendarId: v.optional(v.id("calendars")),
		color: v.optional(v.string()),
		location: v.optional(v.string()),
		allDay: v.boolean(),
		startDateStr: v.optional(v.string()),
		endDateStr: v.optional(v.string()),
		startTime: v.optional(v.string()),
		endTime: v.optional(v.string()),
		timeZone: v.optional(v.string()),
		busy: v.optional(
			v.union(
				v.literal("busy"),
				v.literal("free"),
				v.literal("tentative"),
				v.literal("outOfOffice"),
			),
		),
		visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
		externalTaskProvider: v.optional(v.union(v.literal("linear"))),
		externalTaskId: v.optional(v.string()),
		externalTaskUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		let derivedStartTimestamp = args.startTimestamp;
		let derivedEndTimestamp = args.endTimestamp;

		if (derivedStartTimestamp === undefined || derivedEndTimestamp === undefined) {
			if (args.allDay && args.startDateStr && args.endDateStr) {
				const startDateObj = new Date(args.startDateStr + "T00:00:00Z");
				const endDateObj = new Date(args.endDateStr + "T00:00:00Z");
				derivedStartTimestamp = startDateObj.getTime();
				derivedEndTimestamp = endDateObj.getTime();
			} else {
				throw new Error(
					"Must provide startTimestamp/endTimestamp for timed events, or startDateStr/endDateStr for all-day events"
				);
			}
		}

		if (derivedEndTimestamp < derivedStartTimestamp) {
			throw new Error("End date must be after start date");
		}

		const eventId = await ctx.db.insert("events", {
			...args,
			startTimestamp: derivedStartTimestamp,
			endTimestamp: derivedEndTimestamp,
			userId: ctx.user._id,
			busy: args.busy ?? "free",
			visibility: args.visibility ?? "public",
		});

		if (args.externalTaskId && args.externalTaskUrl) {
			await ctx.db.insert("eventTaskLinks", {
				eventId,
				externalTaskId: args.externalTaskId,
				provider: "linear",
				url: args.externalTaskUrl,
			});
		}

		if (args.calendarId) {
			const ext = await ctx.db
				.query("externalCalendars")
				.withIndex("by_calendar", (q) =>
					q.eq("calendarId", args.calendarId),
				)
				.unique();
			if (ext?.provider === "google") {
				await ctx.scheduler.runAfter(
					0,
					internal.googleCalendar.actionsNode.createEventInGoogle,
					{ eventId },
				);
			}
		}

		return eventId;
	},
});

export const updateEvent = authMutation({
	args: {
		id: v.id("events"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		startTimestamp: v.optional(v.number()),
		endTimestamp: v.optional(v.number()),
		calendarId: v.optional(v.id("calendars")),
		color: v.optional(v.string()),
		location: v.optional(v.string()),
		allDay: v.optional(v.boolean()),
		startDateStr: v.optional(v.string()),
		endDateStr: v.optional(v.string()),
		startTime: v.optional(v.string()),
		endTime: v.optional(v.string()),
		timeZone: v.optional(v.string()),
		recurringEditMode: v.optional(v.union(v.literal("this"), v.literal("all"))),
		busy: v.optional(
			v.union(
				v.literal("busy"),
				v.literal("free"),
				v.literal("tentative"),
				v.literal("outOfOffice"),
			),
		),
		visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
		externalTaskProvider: v.optional(v.union(v.literal("linear"))),
		externalTaskId: v.optional(v.string()),
		externalTaskUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, recurringEditMode, ...updates } = args;
		const event = await ctx.db.get(id);

		if (!event) {
			throw new Error("Event not found");
		}
		if (event.userId !== ctx.user._id) {
			throw new Error("Not authorized to update this event");
		}

		if (
			event.externalProvider === "google" &&
			event.isEditable === false
		) {
			throw new Error(
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
			if (!allDay && startDateStr && startTime && endDateStr && endTime && timeZone) {
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

		const newStartTimestamp = derived.start ?? updates.startTimestamp ?? event.startTimestamp;
		const newEndTimestamp = derived.end ?? updates.endTimestamp ?? event.endTimestamp;

		if (newEndTimestamp < newStartTimestamp) {
			throw new Error("End date must be after start date");
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined)
		);

		if (derived.start !== undefined) {
			cleanUpdates.startTimestamp = derived.start;
		}
		if (derived.end !== undefined) {
			cleanUpdates.endTimestamp = derived.end;
		}

		if (allDay) {
			(cleanUpdates as Record<string, unknown>).startTime = undefined;
			(cleanUpdates as Record<string, unknown>).endTime = undefined;
			(cleanUpdates as Record<string, unknown>).timeZone = undefined;
		}

		const willSyncToGoogle =
			event.externalProvider === "google" &&
			event.isEditable === true &&
			event.externalEventId &&
			event.externalCalendarId;
		console.log("[updateEvent] eventId=%s externalProvider=%s isEditable=%s hasExternalIds=%s willSyncToGoogle=%s", id, event.externalProvider, event.isEditable, Boolean(event.externalEventId && event.externalCalendarId), willSyncToGoogle);

		if (willSyncToGoogle) {
			const originalStartTimestamp =
				event.recurringEventId && recurringEditMode === "this"
					? event.startTimestamp
					: undefined;
			console.log("[updateEvent] scheduling syncEventToGoogle for eventId=%s", id);
			await ctx.scheduler.runAfter(0, internal.googleCalendar.actionsNode.syncEventToGoogle, {
				eventId: id,
				updates: cleanUpdates,
				recurringEditMode,
				originalStartTimestamp,
			});
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
					console.log("[updateEvent] scheduling createEventInGoogle for eventId=%s", id);
					await ctx.scheduler.runAfter(
						0,
						internal.googleCalendar.actionsNode.createEventInGoogle,
						{ eventId: id },
					);
				}
			}
		}

		return await ctx.db.patch(id, cleanUpdates);
	},
});

export const deleteEvent = authMutation({
	args: {
		id: v.id("events"),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.id);

		if (!event) {
			throw new Error("Event not found");
		}
		if (event.userId !== ctx.user._id) {
			throw new Error("Not authorized to delete this event");
		}

		const externalProvider = event.externalProvider;
		const externalEventId = event.externalEventId;
		const externalCalendarId = event.externalCalendarId;

		const links = await ctx.db
			.query("eventTaskLinks")
			.withIndex("by_event", (q) => q.eq("eventId", args.id))
			.collect();
		for (const link of links) {
			await ctx.db.delete(link._id);
		}

		await ctx.db.delete(args.id);

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
