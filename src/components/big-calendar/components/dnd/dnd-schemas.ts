import { ZEventSchema } from "@/components/big-calendar/interfaces";
import { z } from "zod";

/** Drag data for moving an event (week/day grid or month day cell). */
export const ZEventDragData = z.object({
	type: z.literal("event"),
	event: ZEventSchema,
	width: z.number().optional(),
	height: z.number().optional(),
});

/** Drag data for resizing an event (top or bottom handle). */
export const ZEventResizeDragData = z.object({
	type: z.literal("event-resize"),
	event: ZEventSchema,
	edge: z.enum(["top", "bottom"]),
});

/** Active draggable payload: event move or event resize. */
export const ZCalendarDragData = z.discriminatedUnion("type", [
	ZEventDragData,
	ZEventResizeDragData,
]);

/** Over-data when dropped on a time block (day/week grid). */
export const ZTimeBlockOverData = z.object({
	type: z.literal("time-block"),
	slotStartTimestamp: z.number(),
	dateTimestamp: z.number().optional(),
	hour: z.number().optional(),
	minute: z.number().optional(),
});

/** Over-data when dropped on a day cell (month view). */
export const ZDayCellOverData = z.object({
	type: z.literal("day-cell"),
	cell: z.object({
		day: z.number(),
		currentMonth: z.boolean(),
		date: z.coerce.date(),
	}),
});

export type EventDragData = z.infer<typeof ZEventDragData>;
export type EventResizeDragData = z.infer<typeof ZEventResizeDragData>;
export type CalendarDragData = z.infer<typeof ZCalendarDragData>;
export type TimeBlockOverData = z.infer<typeof ZTimeBlockOverData>;
export type DayCellOverData = z.infer<typeof ZDayCellOverData>;
