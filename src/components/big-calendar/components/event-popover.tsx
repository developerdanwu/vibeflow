"use client";

import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import type { IEvent } from "@/components/big-calendar/interfaces";
import type { TEventColor } from "@/components/big-calendar/types";
import { Button } from "@/components/ui/button";
import ColorPickerCompact from "@/components/ui/color-picker-compact";
import { DayPicker } from "@/components/ui/day-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput } from "@/components/ui/time-input";
import { useDisclosure } from "@/hooks/use-disclosure";
import type { PopoverRootProps } from "@base-ui/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Time } from "@internationalized/date";
import { formOptions, useStore } from "@tanstack/react-form-start";
import { useMutation } from "convex/react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { InfoIcon, Trash2 } from "lucide-react";
import { forwardRef, useId, useImperativeHandle, useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";

const colorNameToHex: Record<TEventColor, string> = {
	blue: "#3B82F6",
	green: "#22C55E",
	red: "#EF4444",
	yellow: "#EAB308",
	purple: "#A855F7",
	orange: "#F97316",
	gray: "#6B7280",
};

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

function colorDistance(
	rgb1: { r: number; g: number; b: number },
	rgb2: { r: number; g: number; b: number },
): number {
	const dr = rgb1.r - rgb2.r;
	const dg = rgb1.g - rgb2.g;
	const db = rgb1.b - rgb2.b;
	return Math.sqrt(dr * dr + dg * dg + db * db);
}

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

export const eventFormSchema = z
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

type EventPopoverMode = "create" | "edit";

function getCreateDefaultValues(
	date: Date,
	initialTime?: { hour: number; minute: number },
): TEventFormData {
	const hasTime = initialTime != null;
	const startTime = hasTime
		? new Time(initialTime.hour, initialTime.minute)
		: new Time(9, 0);
	const endTime = hasTime
		? new Time(initialTime.hour + 1, initialTime.minute)
		: new Time(10, 0);
	return {
		title: "",
		description: "",
		startDate: date,
		endDate: date,
		allDay: !hasTime,
		startTime,
		endTime,
		color: "#3B82F6",
	};
}

function getEditDefaultValues(event: IEvent): TEventFormData {
	const startDate = parseISO(event.startDate);
	const rawEndDate = parseISO(event.endDate);
	const endDate = event.allDay ? subDays(rawEndDate, 1) : rawEndDate;

	let startTime: Time | undefined;
	let endTime: Time | undefined;

	if (!event.allDay && event.startTime && event.endTime) {
		const [startHour, startMin] = event.startTime.split(":").map(Number);
		const [endHour, endMin] = event.endTime.split(":").map(Number);
		startTime = new Time(startHour, startMin);
		endTime = new Time(endHour, endMin);
	} else if (!event.allDay) {
		startTime = new Time(startDate.getHours(), startDate.getMinutes());
		endTime = new Time(rawEndDate.getHours(), rawEndDate.getMinutes());
	}

	const colorHex = colorNameToHex[event.color] ?? "#3B82F6";

	return {
		title: event.title,
		description: event.description ?? "",
		startDate,
		endDate,
		allDay: event.allDay,
		startTime,
		endTime,
		color: colorHex,
	};
}

const eventFormOptions = formOptions({
	defaultValues: getCreateDefaultValues(new Date(), { hour: 9, minute: 0 }),
	validators: {
		onSubmit: eventFormSchema,
	},
});

export type EventPopoverContentHandle = {
	submitIfDirty: () => void;
};

interface EventPopoverContentProps {
	onClose: () => void;
	date: Date;
	initialTime?: { hour: number; minute: number };
	mode?: EventPopoverMode;
	event?: IEvent;
}

const EventPopoverContent = forwardRef<
	EventPopoverContentHandle,
	EventPopoverContentProps
>(function EventPopoverContent(
	{ onClose, date, initialTime, mode = "create", event },
	ref,
) {
	const formId = useId();
	const titleId = useId();

	const createEvent = useMutation(api.events.createEvent);
	const updateEvent = useMutation(api.events.updateEvent);
	const deleteEvent = useMutation(api.events.deleteEvent);
	const [_, calendarStore] = useCalendar();

	const handleDelete = async () => {
		if (!event?.convexId) {
			console.error("Cannot delete event without convexId");
			return;
		}
		try {
			onClose();
			await deleteEvent({ id: event.convexId as Id<"events"> });
			toast.success("Event deleted");
		} catch (error) {
			console.error("Failed to delete event:", error);
			toast.error("Failed to delete event");
		}
	};

	const defaults =
		mode === "edit" && event
			? getEditDefaultValues(event)
			: getCreateDefaultValues(date, initialTime);

	const form = useAppForm({
		...eventFormOptions,
		defaultValues: defaults,
		onSubmit: async ({ value }) => {
			try {
				const values = value as TEventFormData;
				const colorName = values.color ? hexToColorName(values.color) : "blue";

				if (mode === "edit" && event?.convexId) {
					if (values.allDay) {
						await updateEvent({
							id: event.convexId as Id<"events">,
							title: values.title,
							description: values.description || "",
							allDay: true,
							startDateStr: format(values.startDate, "yyyy-MM-dd"),
							endDateStr: format(addDays(values.endDate, 1), "yyyy-MM-dd"),
							color: colorName,
						});
					} else {
						const startTimeVal = values.startTime ?? new Time(9, 0);
						const endTimeVal = values.endTime ?? new Time(10, 0);

						const startDateTime = new Date(values.startDate);
						startDateTime.setHours(
							startTimeVal.hour,
							startTimeVal.minute,
							0,
							0,
						);

						const endDateTime = new Date(values.endDate);
						endDateTime.setHours(endTimeVal.hour, endTimeVal.minute, 0, 0);

						const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

						await updateEvent({
							id: event.convexId as Id<"events">,
							title: values.title,
							description: values.description || "",
							allDay: false,
							startDateStr: format(values.startDate, "yyyy-MM-dd"),
							startTime: format(startDateTime, "HH:mm"),
							endDateStr: format(values.endDate, "yyyy-MM-dd"),
							endTime: format(endDateTime, "HH:mm"),
							timeZone: browserTz,
							color: colorName,
						});
					}
					toast.success("Event updated");
				} else {
					if (values.allDay) {
						await createEvent({
							title: values.title,
							description: values.description || "",
							allDay: true,
							startDateStr: format(values.startDate, "yyyy-MM-dd"),
							endDateStr: format(addDays(values.endDate, 1), "yyyy-MM-dd"),
							color: colorName,
						});
					} else {
						const startTimeVal = values.startTime ?? new Time(9, 0);
						const endTimeVal = values.endTime ?? new Time(10, 0);

						const startDateTime = new Date(values.startDate);
						startDateTime.setHours(
							startTimeVal.hour,
							startTimeVal.minute,
							0,
							0,
						);

						const endDateTime = new Date(values.endDate);
						endDateTime.setHours(endTimeVal.hour, endTimeVal.minute, 0, 0);

						const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

						await createEvent({
							title: values.title,
							description: values.description || "",
							allDay: false,
							startDateStr: format(values.startDate, "yyyy-MM-dd"),
							startTime: format(startDateTime, "HH:mm"),
							endDateStr: format(values.endDate, "yyyy-MM-dd"),
							endTime: format(endDateTime, "HH:mm"),
							timeZone: browserTz,
							color: colorName,
						});
					}
					toast.success("Event created");
				}

				onClose();
				form.reset(
					mode === "edit" && event
						? getEditDefaultValues(event)
						: getCreateDefaultValues(date, initialTime),
				);
			} catch (error) {
				console.error(
					`Failed to ${mode === "edit" ? "update" : "create"} event:`,
					error,
				);
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
					console.log("onSubmit");
					e.preventDefault();
					form.handleSubmit();
				}}
				className="grid"
			>
				{mode === "edit" && (
					<div className="absolute -top-9 right-0 flex rounded-md border bg-background">
						<Popover>
							<PopoverTrigger
								render={
									<Button variant="ghost" size="icon-sm" type="button">
										<InfoIcon />
									</Button>
								}
							/>
							<PopoverContent side="bottom" align="end" className="w-56 p-3">
								<div className="space-y-1.5 text-muted-foreground text-xs">
									<p>
										<span className="font-medium text-foreground">
											Created:
										</span>{" "}
										{event?.createdAt
											? format(new Date(event.createdAt), "PPp")
											: "—"}
									</p>
									<p>
										<span className="font-medium text-foreground">
											Updated:
										</span>{" "}
										{event?.updatedAt
											? format(new Date(event.updatedAt), "PPp")
											: "—"}
									</p>
								</div>
							</PopoverContent>
						</Popover>
						<Button
							variant="destructive-ghost"
							size="icon-sm"
							type="button"
							onClick={handleDelete}
						>
							<Trash2 />
						</Button>
					</div>
				)}
				<div className="flex w-full items-center justify-between p-2">
					<div className="flex gap-1">
						<form.AppField name="startDate">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<DayPicker
											fieldClassName="w-min"
											dateFormat="EEE, MMM d"
											date={field.state.value}
											setDate={(d) =>
												field.handleChange(d ?? field.state.value)
											}
											buttonProps={{
												size: "xs",
											}}
										/>
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
													if (mode === "create") {
														calendarStore.trigger.setNewEventStartTime({
															startTime: value,
														});
													}
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
								return (
									<Field data-invalid={isInvalid}>
										<DayPicker
											fieldClassName="w-min"
											dateFormat="EEE, MMM d"
											date={field.state.value}
											setDate={(d) =>
												field.handleChange(d ?? field.state.value)
											}
											buttonProps={{
												size: "xs",
											}}
										/>
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
								if (mode === "create") {
									calendarStore.trigger.setNewEventAllDay({
										allDay: value ?? false,
									});
								}
							},
							onChange: ({ value }) => {
								if (mode === "create") {
									calendarStore.trigger.setNewEventAllDay({
										allDay: value ?? false,
									});
								}
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
								if (mode === "create") {
									calendarStore.trigger.setNewEventTitle({
										title: value ?? "",
									});
								}
							},
							onChange: ({ value }) => {
								if (mode === "create") {
									calendarStore.trigger.setNewEventTitle({
										title: value ?? "",
									});
								}
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

export function EventPopover({
	handle,
}: {
	handle: NonNullable<PopoverRootProps["handle"]>;
}) {
	const { isOpen, onClose, onToggle } = useDisclosure();
	const contentRef = useRef<EventPopoverContentHandle | null>(null);

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
					mode?: EventPopoverMode;
					event?: IEvent;
				};

				if (!payload?.date) {
					return null;
				}

				const mode = payload.mode ?? "create";
				const key =
					mode === "edit" && payload.event
						? `edit-${payload.event.id}`
						: payload.time
							? `${payload.date.toISOString()}-${payload.time.hour}-${payload.time.minute}`
							: payload.date.toISOString();

				return (
					<EventPopoverContent
						ref={contentRef}
						key={key}
						date={payload.date}
						initialTime={payload.time}
						mode={mode}
						event={payload.event}
						onClose={handleClose}
					/>
				);
			}}
		</Popover>
	);
}
