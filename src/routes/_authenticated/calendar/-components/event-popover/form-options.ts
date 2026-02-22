/**
 * Shared event popover form options and default values.
 * Used by event-popover.tsx and by withForm in event-form-body.tsx / task-form-body.tsx.
 */
import type { Id } from "@convex/_generated/dataModel";
import { Time } from "@internationalized/date";
import { formOptions } from "@tanstack/react-form";
import { z } from "zod";

export const eventFormSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		startDate: z.date({ message: "Date is required" }),
		endDate: z.date({ message: "Date is required" }),
		description: z.string().optional(),
		allDay: z.boolean(),
		startTime: z.custom<Time>().optional(),
		endTime: z.custom<Time>().optional(),
		/** Hex string, or null for "use calendar color" in edit mode. */
		color: z.union([
			z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"),
			z.null(),
		]),
		calendarId: z.custom<Id<"calendars">>().optional(),
		busy: z.enum(["busy", "free", "tentative", "outOfOffice"]).optional(),
		visibility: z.enum(["public", "private"]).optional(),
		eventKind: z.enum(["event", "task"]),
		relatedTaskLinks: z
			.array(
				z.object({
					externalTaskId: z.string(),
					url: z.string(),
				}),
			)
			.default([]),
		recurrenceRule: z
			.enum(["none", "daily", "weekly", "monthly"])
			.optional()
			.default("none"),
		recurrenceEnd: z
			.enum(["never", "onDate", "after"])
			.optional()
			.default("never"),
		recurrenceEndDate: z.date().optional(),
		recurrenceCount: z.number().int().min(1).optional(),
	})
	.superRefine((data, ctx) => {
		if (data.allDay) {
			if (data.startDate > data.endDate) {
				ctx.addIssue({
					code: "custom",
					message: "Start date must be before or equal to end date",
					path: ["endDate"],
				});
			}
			return;
		}

		if (!data.startTime || !data.endTime) {
			return ctx.addIssue({
				code: "custom",
				message: "Start time and end time are required when not all day",
				path: ["startTime"],
			});
		}

		const startDateTime = new Date(data.startDate);
		startDateTime.setHours(data.startTime.hour, data.startTime.minute, 0, 0);
		const endDateTime = new Date(data.endDate);
		endDateTime.setHours(data.endTime.hour, data.endTime.minute, 0, 0);
		if (startDateTime > endDateTime) {
			ctx.addIssue({
				code: "custom",
				message: "Start must be before end",
				path: ["endTime"],
			});
		}
	});

export type TEventFormData = z.infer<typeof eventFormSchema>;

export type RecurrenceRuleType = "none" | "daily" | "weekly" | "monthly";
export type RecurrenceEndType = "never" | "onDate" | "after";

export type GetCreateDefaultValuesInput = {
	startDate: Date;
	endDate?: Date;
	startTime?: Time;
	endTime?: Time;
	title?: string;
	description?: string;
	allDay?: boolean;
	color?: string;
	calendarId?: Id<"calendars">;
	busy?: "busy" | "free" | "tentative" | "outOfOffice";
	visibility?: "public" | "private";
	eventKind?: "event" | "task";
	relatedTaskLinks?: Array<{ externalTaskId: string; url: string }>;
	recurrenceRule?: RecurrenceRuleType;
	recurrenceEnd?: RecurrenceEndType;
	recurrenceEndDate?: Date;
	recurrenceCount?: number;
};

export function getCreateDefaultValues(
	input: GetCreateDefaultValuesInput,
): TEventFormData {
	const {
		startDate,
		endDate = startDate,
		startTime = new Time(9, 0),
		endTime = new Time(10, 0),
		title = "",
		description = "",
		allDay = true,
		color = "#3B82F6",
		calendarId,
		busy = "free",
		visibility = "public",
		eventKind = "event",
		relatedTaskLinks = [],
		recurrenceRule = "none",
		recurrenceEnd = "never",
		recurrenceEndDate,
		recurrenceCount,
	} = input;
	return {
		title,
		description,
		startDate,
		endDate,
		allDay,
		startTime,
		endTime,
		color,
		calendarId,
		busy,
		visibility,
		eventKind,
		relatedTaskLinks,
		recurrenceRule,
		recurrenceEnd,
		recurrenceEndDate,
		recurrenceCount,
	};
}

export const eventFormOptions = formOptions({
	defaultValues: getCreateDefaultValues({
		startDate: new Date(),
	}),
	validators: {
		// Zod schema: base @tanstack/react-form types don't include Zod; runtime works
		onSubmit: eventFormSchema as any,
	},
});
