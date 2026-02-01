"use client";

import ColorPickerCompact from "@/components/ui/color-picker-compact";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput } from "@/components/ui/time-input";
import { useDisclosure } from "@/hooks/use-disclosure";
import type { PopoverRootProps } from "@base-ui/react";
import type { CalendarDate } from "@internationalized/date";
import {
	fromDate,
	getLocalTimeZone,
	Time,
	toCalendarDate,
	toCalendarDateTime,
} from "@internationalized/date";
import { formOptions, useStore } from "@tanstack/react-form-start";
import { useMutation } from "convex/react";
import {
	forwardRef,
	useEffect,
	useId,
	useImperativeHandle,
	useRef,
} from "react";
import {
	Button,
	Calendar,
	DateInput,
	DatePicker,
	DateSegment,
	Dialog,
	Group,
	Popover as RACPopover,
} from "react-aria-components";
import { toast } from "sonner";
import { z } from "zod";
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

function isCalendarDate(v: unknown): v is CalendarDate {
	return (
		v != null &&
		typeof v === "object" &&
		"calendar" in v &&
		"year" in v &&
		"month" in v &&
		"day" in v &&
		typeof (v as CalendarDate).compare === "function"
	);
}

const calendarDateSchema = z.custom<CalendarDate>(
	(v) => isCalendarDate(v) && v != null,
	{ message: "Date is required" },
);

export const quickAddEventSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		startDate: calendarDateSchema,
		endDate: calendarDateSchema,
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
		// Validate date ordering (CalendarDate.compare: negative = a before b)
		if (
			data.startDate != null &&
			data.endDate != null &&
			data.startDate.compare(data.endDate) > 0
		) {
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

function getDefaultValues(
	date: Date,
	initialTime?: { hour: number; minute: number },
): TQuickAddEventFormData {
	const hasTime = initialTime != null;
	const startTime = hasTime
		? new Time(initialTime.hour, initialTime.minute)
		: new Time(9, 0);
	const endTime = hasTime
		? new Time(initialTime.hour + 1, initialTime.minute)
		: new Time(10, 0);
	const calendarDate = toCalendarDate(fromDate(date, getLocalTimeZone()));
	return {
		title: "",
		description: "",
		startDate: calendarDate,
		endDate: calendarDate,
		allDay: !hasTime,
		startTime,
		endTime,
		color: "#3B82F6",
	};
}

const addEventFormOptions = formOptions({
	defaultValues: getDefaultValues(new Date(), { hour: 9, minute: 0 }),
	validators: {
		onSubmit: quickAddEventSchema,
	},
});

export type QuickAddEventPopoverContentHandle = {
	submitIfDirty: () => void;
};

const QuickAddEventPopoverContent = forwardRef<
	QuickAddEventPopoverContentHandle,
	{
		onClose: () => void;
		date: Date;
		initialTime?: { hour: number; minute: number };
	}
>(function QuickAddEventPopoverContent({ onClose, date, initialTime }, ref) {
	const formId = useId();
	const titleId = useId();

	const createEvent = useMutation(api.events.createEvent);
	const [_, calendarStore] = useCalendar();
	const defaults = getDefaultValues(date, initialTime);
	const form = useAppForm({
		...addEventFormOptions,
		defaultValues: defaults,
		onSubmit: async ({ value }) => {
			try {
				const values = value as TQuickAddEventFormData;
				if (!values.startDate || !values.endDate) return;

				const tz = getLocalTimeZone();
				let startDt: import("@internationalized/date").CalendarDateTime;
				let endDt: import("@internationalized/date").CalendarDateTime;

				if (values.allDay) {
					startDt = toCalendarDateTime(values.startDate, new Time(0, 0, 0, 0));
					endDt = toCalendarDateTime(values.endDate, new Time(23, 59, 59, 999));
				} else {
					const startTime = values.startTime ?? new Time(9, 0);
					const endTime = values.endTime ?? new Time(10, 0);
					startDt = toCalendarDateTime(values.startDate, startTime);
					endDt = toCalendarDateTime(values.endDate, endTime);
				}

				const startDate = startDt.toDate(tz).getTime();
				const endDate = endDt.toDate(tz).getTime();
				const colorName = values.color ? hexToColorName(values.color) : "blue";

				await createEvent({
					title: values.title,
					description: values.description || "",
					startDate,
					endDate,
					color: colorName,
					allDay: values.allDay,
				});

				toast.success("Event created");
				onClose();
				form.reset(getDefaultValues(date, initialTime));
			} catch (error) {
				console.error("Failed to create event:", error);
			}
		},
	});
	const isDirty = useStore(form.store, (state) => state.isDirty);
	const formRef = useRef<HTMLFormElement | null>(null);

	useImperativeHandle(
		ref,
		() => ({
			submitIfDirty: () => {
				if (isDirty) {
					formRef.current?.requestSubmit();
				}
			},
		}),
		[isDirty],
	);

	useEffect(() => {
		return () => {
			if (isDirty) {
				form.handleSubmit();
			}
		};
	}, [isDirty, form]);

	return (
		<PopoverContent
			className="w-[480px] p-0"
			side="right"
			align="start"
			backdrop
		>
			<form
				ref={formRef}
				id={formId}
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="grid"
			>
				<div className="flex w-full items-center justify-between p-2">
					<div className="flex gap-1">
						<form.AppField name="startDate">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								const value = field.state.value ?? undefined;
								return (
									<Field data-invalid={isInvalid}>
										<DatePicker<CalendarDate>
											value={value ?? null}
											onChange={(v) =>
												field.handleChange(v ?? field.state.value ?? null)
											}
											className="w-min"
											aria-invalid={isInvalid}
										>
											<Group className="inline-flex h-6 min-w-0 items-center gap-0.5 rounded-md border border-input bg-background px-2 py-0.5 text-xs shadow-xs">
												<DateInput className="flex min-w-0 flex-1 items-center gap-0.5">
													{(segment) => (
														<DateSegment
															segment={segment}
															className="rounded px-0.5 outline-none data-placeholder:text-muted-foreground"
														/>
													)}
												</DateInput>
												<Button
													className="rounded p-0.5 outline-none hover:bg-muted"
													aria-label="Pick start date"
												>
													<svg
														aria-hidden
														xmlns="http://www.w3.org/2000/svg"
														width="12"
														height="12"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<title>Calendar</title>
														<rect
															width="18"
															height="18"
															x="3"
															y="4"
															rx="2"
															ry="2"
														/>
														<line x1="16" x2="16" y1="2" y2="6" />
														<line x1="8" x2="8" y1="2" y2="6" />
														<line x1="3" x2="21" y1="10" y2="10" />
													</svg>
												</Button>
											</Group>
											<RACPopover className="w-auto overflow-hidden rounded-md border bg-popover p-0 shadow-md">
												<Dialog className="p-0 outline-none">
													<Calendar className="p-2" />
												</Dialog>
											</RACPopover>
										</DatePicker>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.AppField>

						<form.Subscribe selector={(state) => state.values.allDay}>
							{(allDay) =>
								!allDay ? (
									<>
										<form.AppField
											name="startTime"
											listeners={{
												onChange: ({ value }) => {
													calendarStore.trigger.setNewEventStartTime({
														startTime: value,
													});
												},
											}}
										>
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched &&
													!field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<TimeInput
															size="xs"
															value={field.state.value}
															onChange={(value) => {
																if (value != null)
																	field.handleChange(value as Time);
															}}
															data-invalid={isInvalid}
														/>
														{isInvalid && (
															<FieldError errors={field.state.meta.errors} />
														)}
													</Field>
												);
											}}
										</form.AppField>
										<form.AppField name="endTime">
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched &&
													!field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<TimeInput
															size="xs"
															value={field.state.value}
															onChange={(value) => {
																if (value != null)
																	field.handleChange(value as Time);
															}}
															data-invalid={isInvalid}
														/>
														{isInvalid && (
															<FieldError errors={field.state.meta.errors} />
														)}
													</Field>
												);
											}}
										</form.AppField>
									</>
								) : null
							}
						</form.Subscribe>

						<form.AppField name="endDate">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								const value = field.state.value ?? undefined;
								return (
									<Field data-invalid={isInvalid}>
										<DatePicker<CalendarDate>
											value={value ?? null}
											onChange={(v) =>
												field.handleChange(v ?? field.state.value ?? null)
											}
											className="w-min"
											aria-invalid={isInvalid}
										>
											<Group className="inline-flex h-6 min-w-0 items-center gap-0.5 rounded-md border border-input bg-background px-2 py-0.5 text-xs shadow-xs">
												<DateInput className="flex min-w-0 flex-1 items-center gap-0.5">
													{(segment) => (
														<DateSegment
															segment={segment}
															className="rounded px-0.5 outline-none data-placeholder:text-muted-foreground"
														/>
													)}
												</DateInput>
												<Button
													className="rounded p-0.5 outline-none hover:bg-muted"
													aria-label="Pick end date"
												>
													~/.config/opencode/skills{" "}
													<svg
														aria-hidden
														xmlns="http://www.w3.org/2000/svg"
														width="12"
														height="12"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<title>Calendar</title>
														<rect
															width="18"
															height="18"
															x="3"
															y="4"
															rx="2"
															ry="2"
														/>
														<line x1="16" x2="16" y1="2" y2="6" />
														<line x1="8" x2="8" y1="2" y2="6" />
														<line x1="3" x2="21" y1="10" y2="10" />
													</svg>
												</Button>
											</Group>
											<RACPopover className="w-auto overflow-hidden rounded-md border bg-popover p-0 shadow-md">
												<Dialog className="p-0 outline-none">
													<Calendar className="p-2" />
												</Dialog>
											</RACPopover>
										</DatePicker>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.AppField>
					</div>
					<form.AppField
						name="allDay"
						listeners={{
							onMount: ({ value }) => {
								calendarStore.trigger.setNewEventAllDay({
									allDay: value ?? false,
								});
							},
							onChange: ({ value }) => {
								calendarStore.trigger.setNewEventAllDay({
									allDay: value ?? false,
								});
							},
						}}
					>
						{(field) => {
							return (
								<div className="flex shrink-0 items-center gap-2">
									<p className="text-muted-foreground text-xs">All Day</p>
									<Switch
										size="sm"
										checked={field.state.value}
										onCheckedChange={field.handleChange}
									/>
								</div>
							);
						}}
					</form.AppField>
				</div>
				<Separator />
				<div className="flex items-center px-2 py-1">
					<form.AppField name="color">
						{(field) => {
							return (
								<ColorPickerCompact
									value={field.state.value ?? "#3B82F6"}
									onChange={field.handleChange}
								/>
							);
						}}
					</form.AppField>
					<form.AppField
						name="title"
						listeners={{
							onMount: ({ value }) => {
								calendarStore.trigger.setNewEventTitle({ title: value ?? "" });
							},
							onChange: ({ value }) => {
								calendarStore.trigger.setNewEventTitle({ title: value ?? "" });
							},
						}}
					>
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Input
									className="rounded-none text-base placeholder:text-base hover:bg-transparent focus:bg-transparent focus-visible:bg-transparent"
									variant="ghost"
									id={titleId}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
									placeholder="Event title"
								/>
							);
						}}
					</form.AppField>
				</div>
				<Separator />
				<form.AppField name="description">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel
									className="sr-only"
									htmlFor={`${field.name}-textarea`}
								>
									Description
								</FieldLabel>
								<Textarea
									id={`${field.name}-textarea`}
									name={field.name}
									rows={3}
									className="min-h-24 resize-none rounded-none hover:bg-transparent focus:bg-transparent focus-visible:bg-transparent"
									variant="ghost"
									value={field.state.value ?? ""}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
									placeholder="Add a description..."
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.AppField>
			</form>
		</PopoverContent>
	);
});

export function QuickAddEventPopover({
	handle,
}: {
	handle: NonNullable<PopoverRootProps["handle"]>;
}) {
	const { isOpen, onClose, onToggle } = useDisclosure();
	const contentRef = useRef<QuickAddEventPopoverContentHandle | null>(null);

	const handleClose = () => {
		onClose();
	};

	return (
		<Popover
			open={isOpen}
			onOpenChange={onToggle}
			handle={handle}
			onOpenChangeComplete={(open) => {
				if (!open) {
					contentRef.current?.submitIfDirty();
				}
			}}
		>
			{({ payload: _payload }) => {
				const payload = _payload as {
					date?: Date;
					time?: { hour: number; minute: number };
				};

				if (!payload?.date) {
					return null;
				}

				const key = payload.time
					? `${payload.date.toISOString()}-${payload.time.hour}-${payload.time.minute}`
					: payload.date.toISOString();

				return (
					<QuickAddEventPopoverContent
						ref={contentRef}
						key={key}
						date={payload.date}
						initialTime={payload.time}
						onClose={handleClose}
					/>
				);
			}}
		</Popover>
	);
}
