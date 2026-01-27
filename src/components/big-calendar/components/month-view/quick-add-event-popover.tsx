"use client";

import type { PopoverRootProps } from "@base-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Time } from "@internationalized/date";
import { useMutation } from "convex/react";
import { endOfDay, startOfDay } from "date-fns";
import { useEffect, useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { DayPicker } from "@/components/ui/day-picker";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import InputColor from "@/components/ui/input-color";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput } from "@/components/ui/time-input";
import { useDisclosure } from "@/hooks/use-disclosure";
import { api } from "../../../../../convex/_generated/api";
import { useCalendar } from "../../store/calendarStore";
import type { TEventColor } from "../../types";

// Color mapping: predefined color names to hex values
const colorNameToHex: Record<TEventColor, string> = {
	blue: "#3B82F6",
	green: "#22C55E",
	red: "#EF4444",
	yellow: "#EAB308",
	purple: "#A855F7",
	orange: "#F97316",
	gray: "#6B7280",
};

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: Number.parseInt(result[1], 16),
				g: Number.parseInt(result[2], 16),
				b: Number.parseInt(result[3], 16),
			}
		: { r: 0, g: 0, b: 0 };
}

// Calculate Euclidean distance between two colors in RGB space
function colorDistance(
	rgb1: { r: number; g: number; b: number },
	rgb2: { r: number; g: number; b: number },
): number {
	const dr = rgb1.r - rgb2.r;
	const dg = rgb1.g - rgb2.g;
	const db = rgb1.b - rgb2.b;
	return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Map hex color to closest predefined color name
function hexToColorName(hex: string): TEventColor {
	const inputRgb = hexToRgb(hex);
	let minDistance = Infinity;
	let closestColor: TEventColor = "blue";

	for (const [colorName, colorHex] of Object.entries(colorNameToHex)) {
		const colorRgb = hexToRgb(colorHex);
		const distance = colorDistance(inputRgb, colorRgb);
		if (distance < minDistance) {
			minDistance = distance;
			closestColor = colorName as TEventColor;
		}
	}

	return closestColor;
}

export const quickAddEventSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		startDate: z.date({ message: "Date is required" }),
		endDate: z.date({ message: "Date is required" }),
		description: z.string().optional(),
		allDay: z.boolean(),
		startTime: z.custom<Time>().optional(),
		endTime: z.custom<Time>().optional(),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
			.optional(),
	})
	.superRefine((data, ctx) => {
		// Validate date ordering
		if (data.startDate > data.endDate) {
			ctx.addIssue({
				code: "custom",
				message: "Start date must be before or equal to end date",
				path: ["endDate"],
			});
		}

		// Validate times when not all day
		if (!data.allDay) {
			// Check if times are provided
			if (!data.startTime || !data.endTime) {
				ctx.addIssue({
					code: "custom",
					message: "Start time and end time are required when not all day",
					path: ["startTime"],
				});
			}
			// Check if start time is before end time
			else if (data.startTime.compare(data.endTime) >= 0) {
				ctx.addIssue({
					code: "custom",
					message: "Start time must be before end time",
					path: ["endTime"],
				});
			}
		}
	});

export type TQuickAddEventFormData = z.infer<typeof quickAddEventSchema>;

function QuickAddEventPopoverContent({
	isOpen,
	onClose,
	date,
}: {
	isOpen: boolean;
	onClose: () => void;
	date: Date;
}) {
	const formId = useId();
	const titleId = useId();

	const createEvent = useMutation(api.events.createEvent);
	const [_, calendarStore] = useCalendar();
	const form = useForm<TQuickAddEventFormData>({
		resolver: zodResolver(quickAddEventSchema),
		defaultValues: {
			title: "",
			description: "",
			startDate: date,
			endDate: date,
			allDay: true,
			startTime: new Time(9, 0),
			endTime: new Time(10, 0),
			color: "#3B82F6",
		},
	});

	const allDay = useWatch({
		control: form.control,
		name: "allDay",
		defaultValue: true,
	});

	useEffect(() => {
		if (!isOpen) {
			form.reset();
		}
	}, [isOpen, form]);

	useEffect(() => {
		const subscription = form.watch((values) => {
			calendarStore.trigger.setNewEventTitle({
				title: values.title || "",
			});
			calendarStore.trigger.setNewEventStartTime({
				startTime: values.startTime as Time,
			});
			calendarStore.trigger.setNewEventAllDay({
				allDay: values.allDay,
			});
		});
		return () => {
			subscription.unsubscribe();
		};
	}, [form.watch, calendarStore.trigger]);

	const onSubmit = async (values: TQuickAddEventFormData) => {
		try {
			let startDateTime: Date;
			let endDateTime: Date;

			if (values.allDay) {
				// All-day events: span from start of startDate to end of endDate
				startDateTime = startOfDay(values.startDate);
				endDateTime = endOfDay(values.endDate);
			} else {
				// Timed events: use time values from form
				const startTime = values.startTime!;
				const endTime = values.endTime!;

				startDateTime = new Date(values.startDate);
				startDateTime.setHours(startTime.hour, startTime.minute, 0, 0);

				endDateTime = new Date(values.endDate);
				endDateTime.setHours(endTime.hour, endTime.minute, 0, 0);
			}

			const colorName = values.color ? hexToColorName(values.color) : "blue";

			await createEvent({
				title: values.title,
				description: values.description || "",
				startDate: startDateTime.getTime(),
				endDate: endDateTime.getTime(),
				color: colorName,
				allDay: values.allDay,
			});

			onClose();
			form.reset();
		} catch (error) {
			console.error("Failed to create event:", error);
		}
	};

	return (
		<PopoverContent
			className="w-[480px] p-0"
			side="right"
			align="start"
			backdrop
		>
			<Form {...form}>
				<form
					id={formId}
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid"
				>
					<div className="flex items-center justify-between p-2">
						<div className="flex gap-1">
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<DayPicker
												fieldClassName="w-min"
												dateFormat="EEE, MMM d"
												date={field.value}
												setDate={field.onChange}
												buttonProps={{
													size: "xs",
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{!allDay && (
								<>
									<FormField
										control={form.control}
										name="startTime"
										render={({ field, fieldState }) => (
											<FormItem>
												<FormControl>
													<TimeInput
														size="xs"
														value={field.value}
														onChange={field.onChange}
														data-invalid={fieldState.invalid}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="endTime"
										render={({ field, fieldState }) => (
											<FormItem>
												<FormControl>
													<TimeInput
														size="xs"
														value={field.value}
														onChange={field.onChange}
														data-invalid={fieldState.invalid}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</>
							)}
							<FormField
								control={form.control}
								name="endDate"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<DayPicker
												fieldClassName="w-min"
												dateFormat="EEE, MMM d"
												date={field.value}
												setDate={field.onChange}
												buttonProps={{
													size: "xs",
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="allDay"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<div className="flex items-center gap-2">
											<p className="text-muted-foreground text-xs">All Day</p>
											<Switch
												size="sm"
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<Separator />
					<FormField
						control={form.control}
						name="title"
						render={({ field, fieldState }) => (
							<FormItem className="py-2">
								<FormControl>
									<div className="flex items-center gap-2">
										<FormField
											control={form.control}
											name="color"
											render={({ field: colorField }) => (
												<FormItem>
													<FormControl>
														<div className="shrink-0">
															<InputColor
																value={colorField.value || "#3B82F6"}
																onChange={colorField.onChange}
																onBlur={colorField.onBlur}
																label=""
																className="mt-0"
															/>
														</div>
													</FormControl>
												</FormItem>
											)}
										/>
										<Input
											className={
												"flex-1 rounded-none hover:bg-transparent focus:bg-transparent focus-visible:bg-transparent"
											}
											variant="ghost"
											id={titleId}
											placeholder="Event title"
											data-invalid={fieldState.invalid}
											{...field}
										/>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field, fieldState }) => (
							<FormItem>
								<FormControl>
									<Textarea
										{...field}
										className={
											"rounded-none hover:bg-transparent focus:bg-transparent focus-visible:bg-transparent"
										}
										variant={"ghost"}
										value={field.value || ""}
										placeholder="Add a description..."
										data-invalid={fieldState.invalid}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</PopoverContent>
	);
}

export function QuickAddEventPopover({
	handle,
}: {
	handle: NonNullable<PopoverRootProps["handle"]>;
}) {
	const { isOpen, onClose, onToggle } = useDisclosure();

	const handleClose = () => {
		onClose();
	};

	return (
		<Popover open={isOpen} onOpenChange={onToggle} handle={handle}>
			{({ payload: _payload }) => {
				console.log("payload", _payload);
				const payload = _payload as { date?: Date };

				if (!payload?.date) {
					return null;
				}

				return (
					<QuickAddEventPopoverContent
						isOpen={isOpen}
						key={payload.date.toISOString()}
						date={payload.date}
						onClose={handleClose}
					/>
				);
			}}
		</Popover>
	);
}
