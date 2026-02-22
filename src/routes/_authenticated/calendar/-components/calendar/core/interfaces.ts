import { z } from "zod";

/** Event color is stored and displayed as hex (e.g. "#3B82F6"). API returns hex. */
const ZEventColorSchema = z.string();

export const ZUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	picturePath: z.string().nullable(),
});

export const ZEventSchema = z.object({
	id: z.string(),
	convexId: z.string().optional(),
	startDate: z.string(),
	endDate: z.string(),
	title: z.string(),
	color: ZEventColorSchema,
	description: z.string(),
	user: ZUserSchema,
	allDay: z.boolean(),
	startDateStr: z.string().optional(),
	endDateStr: z.string().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	timeZone: z.string().optional(),
	createdAt: z.number().optional(),
	updatedAt: z.number().optional(),
	recurringEventId: z.string().optional(),
	isEditable: z.boolean().optional(),
	calendarId: z.string().optional(),
	busy: z.enum(["busy", "free", "tentative", "outOfOffice"]).optional(),
	visibility: z.enum(["public", "private"]).optional(),
	eventKind: z.enum(["event", "task"]).optional(),
});

export type TUser = z.infer<typeof ZUserSchema>;
export type TEvent = z.infer<typeof ZEventSchema>;

export interface ICalendarCell {
	day: number;
	currentMonth: boolean;
	date: Date;
}
