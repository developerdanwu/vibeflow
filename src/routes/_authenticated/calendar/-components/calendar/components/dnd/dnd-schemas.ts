import { ZEventSchema } from "@/routes/_authenticated/calendar/-components/calendar/core/interfaces";
import { z } from "zod";

/** Drag data for moving an event (week/day grid or month day cell). */
export const ZEventDragData = z.object({
	type: z.literal("event"),
	event: ZEventSchema,
	width: z.number().optional(),
	height: z.number().optional(),
	/** Set when drag starts from month view so overlay can match month badge UI. */
	sourceView: z.enum(["month", "week", "day"]).optional(),
});

/** Drag data for resizing an event (top or bottom handle). */
export const ZEventResizeDragData = z.object({
	type: z.literal("event-resize"),
	event: ZEventSchema,
	edge: z.enum(["top", "bottom"]),
});

/** Drag data for a task item from the sidebar (schedule-on-drop). */
export const ZTaskItemDragData = z.object({
	type: z.literal("task"),
	taskItem: z.object({
		_id: z.string(),
		externalTaskId: z.string(),
		title: z.string(),
		identifier: z.string().optional(),
		url: z.string(),
	}),
});

/** Active draggable payload: event move, event resize, or task item. */
export const ZCalendarDragData = z.discriminatedUnion("type", [
	ZEventDragData,
	ZEventResizeDragData,
	ZTaskItemDragData,
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
export type TaskItemDragData = z.infer<typeof ZTaskItemDragData>;
export type CalendarDragData = z.infer<typeof ZCalendarDragData>;
export type TimeBlockOverData = z.infer<typeof ZTimeBlockOverData>;
export type DayCellOverData = z.infer<typeof ZDayCellOverData>;
