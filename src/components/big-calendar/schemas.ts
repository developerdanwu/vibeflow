import { z } from "zod";

export const eventSchema = z
	.object({
		user: z.string().optional(),
		title: z.string().min(1, "Title is required"),
		description: z.string().min(1, "Description is required"),
		startDate: z.date({ message: "Start date is required" }),
		startTime: z.object(
			{ hour: z.number(), minute: z.number() },
			{ message: "Start time is required" },
		),
		endDate: z.date({ message: "End date is required" }),
		endTime: z.object(
			{ hour: z.number(), minute: z.number() },
			{ message: "End time is required" },
		),
		color: z.enum(
			["blue", "green", "red", "yellow", "purple", "orange", "gray"],
			{ message: "Color is required" },
		),
	})
	.refine(
		(data) => {
			const startDateTime = new Date(data.startDate);
			startDateTime.setHours(data.startTime.hour, data.startTime.minute, 0, 0);

			const endDateTime = new Date(data.endDate);
			endDateTime.setHours(data.endTime.hour, data.endTime.minute, 0, 0);

			return startDateTime < endDateTime;
		},
		{
			message: "Start date cannot be after end date",
			path: ["startDate"],
		},
	);

export type TEventFormData = z.infer<typeof eventSchema>;

export const quickAddEventSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		startTime: z.object(
			{ hour: z.number(), minute: z.number() },
			{ message: "Start time is required" },
		),
		endTime: z.object(
			{ hour: z.number(), minute: z.number() },
			{ message: "End time is required" },
		),
		description: z.string().optional(),
	})
	.refine(
		(data) => {
			const startMinutes = data.startTime.hour * 60 + data.startTime.minute;
			const endMinutes = data.endTime.hour * 60 + data.endTime.minute;
			return endMinutes > startMinutes;
		},
		{
			message: "End time must be after start time",
			path: ["endTime"],
		},
	);

export type TQuickAddEventFormData = z.infer<typeof quickAddEventSchema>;
