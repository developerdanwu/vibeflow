import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { authQuery } from "../helpers";
import { internalQuery } from "../_generated/server";
import { ErrorCode, throwConvexError } from "../errors";

const DEFAULT_HEX = "#3B82F6";

/** Legacy color names → hex for backward compatibility. */
const NAME_TO_HEX: Record<string, string> = {
	blue: "#3B82F6",
	green: "#22C55E",
	red: "#EF4444",
	yellow: "#EAB308",
	purple: "#A855F7",
	orange: "#F97316",
	gray: "#6B7280",
};

function toHex(value: string | undefined): string {
	if (value == null || value === "") {
		return DEFAULT_HEX;
	}
	if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
		return value;
	}
	const hex = NAME_TO_HEX[value.toLowerCase()];
	return hex ?? DEFAULT_HEX;
}

function resolveEventColor(
	eventColor: string | undefined,
	calendarColor: string | undefined,
): string {
	const raw = eventColor ?? calendarColor;
	return toHex(raw);
}

export const getEventsByUser = authQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("events")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.collect();
	},
});

export const getEventsByDateRange = authQuery({
	args: {
		startTimestamp: v.number(),
		endTimestamp: v.number(),
	},
	handler: async (ctx, args) => {
		const ONE_DAY_MS = 24 * 60 * 60 * 1000;
		const bufferedStart = args.startTimestamp - ONE_DAY_MS;
		const bufferedEnd = args.endTimestamp + ONE_DAY_MS;

		const events = await ctx.db
			.query("events")
			.withIndex("by_user_and_date", (q) =>
				q.eq("userId", ctx.user._id).gte("startTimestamp", bufferedStart),
			)
			.collect();

		const filtered = events.filter((event) => event.startTimestamp <= bufferedEnd);

		const calendars = await ctx.db
			.query("calendars")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.collect();
		const calendarColorById = new Map<Id<"calendars">, string>();
		for (const cal of calendars) {
			calendarColorById.set(cal._id, cal.color);
		}

		return filtered.map((event) => ({
			...event,
			color: resolveEventColor(
				event.color,
				event.calendarId
					? calendarColorById.get(event.calendarId)
					: undefined,
			),
		}));
	},
});

export const getEventById = authQuery({
	args: {
		id: v.id("events"),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get("events", args.id);

		if (!event) {
			return null;
		}
		if (event.userId !== ctx.user._id) {
			throwConvexError(
				ErrorCode.NOT_AUTHORIZED,
				"Not authorized to view this event",
			);
		}

		return event;
	},
});

/** Internal: get event by id for sync operations. */
export const getEventByIdInternal = internalQuery({
	args: { id: v.id("events") },
	handler: async (ctx, args) => {
		return await ctx.db.get("events", args.id);
	},
});
