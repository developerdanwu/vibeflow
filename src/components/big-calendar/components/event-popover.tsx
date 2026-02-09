"use client";

import type { PopoverRootProps } from "@base-ui/react";
import type { Id } from "@convex/_generated/dataModel";
import { Time } from "@internationalized/date";
import { formOptions, useStore } from "@tanstack/react-form-start";
import { addDays, format, parseISO, set, startOfDay, subDays } from "date-fns";
import { InfoIcon, Trash2 } from "lucide-react";
import {
	forwardRef,
	useEffect,
	useId,
	useImperativeHandle,
	useRef,
} from "react";
import { z } from "zod";
import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import { useCreateEventMutation } from "@/components/big-calendar/hooks/use-create-event-mutation";
import { useDeleteEventMutation } from "@/components/big-calendar/hooks/use-delete-event-mutation";
import { useUpdateEventMutation } from "@/components/big-calendar/hooks/use-update-event-mutation";
import {
	type TEvent,
	ZEventSchema,
} from "@/components/big-calendar/interfaces";
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

const colorNameToHex: Record<TEventColor, string> = {
	blue: "#3B82F6",
	green: "#22C55E",
	red: "#EF4444",
	yellow: "#EAB308",
	purple: "#A855F7",
	orange: "#F97316",
	gray: "#6B7280",
};

export const ZEventPopoverForm = z.discriminatedUnion("mode", [
	z.object({
		mode: z.literal("create"),
		title: z.string().optional(),
		startDate: z.date(),
		endDate: z.date().optional(),
		description: z.string().optional(),
		allDay: z.boolean().optional(),
		startTime: z.custom<Time>().optional(),
		endTime: z.custom<Time>().optional(),
		color: z.string().optional(),
	}),
	z.object({
		mode: z.literal("edit"),
		event: ZEventSchema,
	}),
]);

export type TEventPopoverFormData = z.infer<typeof ZEventPopoverForm>;

type TEventPopoverPayload = z.infer<typeof ZEventPopoverForm>;

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

type GetCreateDefaultValuesInput = {
	startDate: Date;
	endDate?: Date;
	startTime?: Time;
	endTime?: Time;
	title?: string;
	description?: string;
	allDay?: boolean;
	color?: string;
};

function getCreateDefaultValues(
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
	};
}

function getTimes(
	event: TEvent,
	startDate: Date,
	rawEndDate: Date,
): { startTime: Time | undefined; endTime: Time | undefined } {
	const startTimeStr = event.startTime;
	const endTimeStr = event.endTime;
	if (!event.allDay && startTimeStr && endTimeStr) {
		const [startHour, startMin] = startTimeStr.split(":").map(Number);
		const [endHour, endMin] = endTimeStr.split(":").map(Number);
		return {
			startTime: new Time(startHour, startMin),
			endTime: new Time(endHour, endMin),
		};
	}
	if (!event.allDay) {
		return {
			startTime: new Time(startDate.getHours(), startDate.getMinutes()),
			endTime: new Time(rawEndDate.getHours(), rawEndDate.getMinutes()),
		};
	}
	return { startTime: undefined, endTime: undefined };
}

const eventFormOptions = formOptions({
	defaultValues: getCreateDefaultValues({
		startDate: new Date(),
	}),
	validators: {
		onSubmit: eventFormSchema,
	},
});

export type EventPopoverContentHandle = {
	runAfterClose: () => void;
};

interface EventPopoverContentProps {
	onClose: () => void;
	initialValues: TEventFormData;
	mode?: EventPopoverMode;
	event?: TEvent;
}

const EventPopoverContent = forwardRef<
	EventPopoverContentHandle,
	EventPopoverContentProps
>(function EventPopoverContent(
	{ onClose, initialValues, mode = "create", event },
	ref,
) {
	const formId = useId();
	const titleId = useId();

	const { mutateAsync: updateEvent } = useUpdateEventMutation({
		meta: { updateType: "edit" },
	});
	const { mutateAsync: createEvent } = useCreateEventMutation();
	const { mutate: deleteEvent } = useDeleteEventMutation();
	const [_, calendarStore] = useCalendar();
	const [storeStartTime] = useCalendar((s) => s.context.newEventStartTime);
	const [storeEndTime] = useCalendar((s) => s.context.newEventEndTime);

	const handleDelete = () => {
		if (!event?.convexId) return;
		runAfterCloseRef.current = () => {
			deleteEvent({ id: event.convexId as Id<"events"> });
		};
		onClose();
	};

	const form = useAppForm({
		...eventFormOptions,
		defaultValues: initialValues,
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

						const startDateTime = set(startOfDay(values.startDate), {
							hours: startTimeVal.hour,
							minutes: startTimeVal.minute,
							seconds: 0,
							milliseconds: 0,
						});
						const endDateTime = set(startOfDay(values.endDate), {
							hours: endTimeVal.hour,
							minutes: endTimeVal.minute,
							seconds: 0,
							milliseconds: 0,
						});

						await updateEvent({
							id: event.convexId as Id<"events">,
							title: values.title,
							description: values.description || "",
							allDay: false,
							startTimestamp: startDateTime.getTime(),
							endTimestamp: endDateTime.getTime(),
							color: colorName,
						});
					}
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

						const startDateTime = set(startOfDay(values.startDate), {
							hours: startTimeVal.hour,
							minutes: startTimeVal.minute,
							seconds: 0,
							milliseconds: 0,
						});
						const endDateTime = set(startOfDay(values.endDate), {
							hours: endTimeVal.hour,
							minutes: endTimeVal.minute,
							seconds: 0,
							milliseconds: 0,
						});

						await createEvent({
							title: values.title,
							description: values.description || "",
							allDay: false,
							startTimestamp: startDateTime.getTime(),
							endTimestamp: endDateTime.getTime(),
							color: colorName,
						});
					}
				}

				form.reset();
				calendarStore.trigger.resetNewEvent();
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
	const runAfterCloseRef = useRef<(() => void) | null>(null);

	// Sync store → form when resize handles change the event times
	useEffect(() => {
		if (mode !== "create") {
			return;
		}
		if (!storeStartTime) {
			return;
		}
		const current = form.getFieldValue("startTime") as Time | undefined;
		if (
			current &&
			current.hour === storeStartTime.hour &&
			current.minute === storeStartTime.minute
		) {
			return;
		}
		form.setFieldValue("startTime", storeStartTime);
	}, [storeStartTime, mode, form]);

	useEffect(() => {
		if (mode !== "create") {
			return;
		}
		if (!storeEndTime) {
			return;
		}
		const current = form.getFieldValue("endTime") as Time | undefined;
		if (
			current &&
			current.hour === storeEndTime.hour &&
			current.minute === storeEndTime.minute
		) {
			return;
		}
		form.setFieldValue("endTime", storeEndTime);
	}, [storeEndTime, mode, form]);

	useImperativeHandle(
		ref,
		() => ({
			runAfterClose: () => {
				if (runAfterCloseRef.current) {
					runAfterCloseRef.current?.();
					runAfterCloseRef.current = null;
				} else {
					if (isDirty) {
						formRef.current?.requestSubmit();
					}
				}

				calendarStore.trigger.resetNewEvent();
			},
		}),
		[isDirty, calendarStore],
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
												onMount: ({ value }) => {
													calendarStore.trigger.setNewEventStartTime({
														startTime: value,
													});
												},
												onBlur: ({ value }) => {
													calendarStore.trigger.setNewEventStartTime({
														startTime: value,
													});
												},
											}}
										>
											{({ state, handleChange, handleBlur }) => {
												const isInvalid =
													state.meta.isTouched && !state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<TimeInput
															size="xs"
															value={state.value}
															onChange={(value) => {
																if (value != null) handleChange(value as Time);
															}}
															data-invalid={isInvalid}
															onBlur={handleBlur}
														/>
														{isInvalid && (
															<FieldError errors={state.meta.errors} />
														)}
													</Field>
												);
											}}
										</form.AppField>
										<form.AppField
											name="endTime"
											listeners={{
												onMount: ({ value }) => {
													calendarStore.trigger.setNewEventEndTime({
														endTime: value,
													});
												},
												onBlur: ({ value }) => {
													calendarStore.trigger.setNewEventEndTime({
														endTime: value,
													});
												},
											}}
										>
											{({ state, handleBlur, handleChange }) => {
												const isInvalid =
													state.meta.isTouched && !state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<TimeInput
															size="xs"
															value={state.value}
															onChange={(value) => {
																if (value != null) handleChange(value as Time);
															}}
															data-invalid={isInvalid}
															onBlur={handleBlur}
														/>
														{isInvalid && (
															<FieldError errors={state.meta.errors} />
														)}
													</Field>
												);
											}}
										</form.AppField>
									</>
								) : null
							}
						</form.Subscribe>

						<form.AppField
							name="endDate"
							listeners={{
								onMount: ({ value }) => {},
								onBlur: ({ value }) => {},
							}}
						>
							{({ state, handleChange, handleBlur }) => {
								const isInvalid = state.meta.isTouched && !state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<DayPicker
											fieldClassName="w-min"
											dateFormat="EEE, MMM d"
											date={state.value}
											setDate={(d) => handleChange(d ?? state.value)}
											buttonProps={{
												size: "xs",
											}}
										/>
										{isInvalid && <FieldError errors={state.meta.errors} />}
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
								calendarStore.trigger.setNewEventTitle({
									title: value ?? "",
								});
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
				<form.AppField
					name="description"
					listeners={{
						onMount: ({ value }) => {
							calendarStore.trigger.setNewEventDescription({
								description: value ?? "",
							});
						},
						onChange: ({ value }) => {
							calendarStore.trigger.setNewEventDescription({
								description: value ?? "",
							});
						},
					}}
				>
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
	const { isOpen, onOpen, onClose } = useDisclosure();
	const contentRef = useRef<EventPopoverContentHandle | null>(null);
	const prevIsOpenRef = useRef(false);
	const openIdRef = useRef(0);
	if (isOpen && !prevIsOpenRef.current) {
		openIdRef.current += 1;
	}
	prevIsOpenRef.current = isOpen;
	const openId = openIdRef.current;

	const handleClose = () => {
		onClose();
	};

	return (
		<Popover
			open={isOpen}
			onOpenChange={(open) => {
				if (open) {
					onOpen();
				} else {
					onClose();
				}
			}}
			handle={handle}
			onOpenChangeComplete={(open) => {
				if (!open) {
					contentRef.current?.runAfterClose();
				}
			}}
		>
			{({ payload: _payload }) => {
				const payload = _payload as TEventPopoverPayload;
				if (!payload) {
					return null;
				}
				if (payload.mode === "edit") {
					const event = payload.event;
					const startDate = parseISO(event.startDate);
					const rawEndDate = parseISO(event.endDate);
					const endDate = event.allDay ? subDays(rawEndDate, 1) : rawEndDate;
					const { startTime, endTime } = getTimes(event, startDate, rawEndDate);
					const initialValues = getCreateDefaultValues({
						startDate,
						endDate,
						startTime,
						endTime,
						title: event.title,
						description: event.description ?? "",
						allDay: event.allDay,
						color: colorNameToHex[event.color] ?? "#3B82F6",
					});
					return (
						<EventPopoverContent
							ref={contentRef}
							key={`edit-${event.id}-${openId}`}
							initialValues={initialValues}
							mode="edit"
							event={event}
							onClose={handleClose}
						/>
					);
				}

				return (
					<EventPopoverContent
						ref={contentRef}
						key={`create-${payload.startDate.toISOString()}-${openId}`}
						initialValues={getCreateDefaultValues({
							startDate: payload.startDate,
							startTime: payload?.startTime,
							endTime: payload?.endTime,
							title: payload?.title,
							allDay: payload?.allDay,
							description: payload?.description,
						})}
						mode="create"
						onClose={handleClose}
					/>
				);
			}}
		</Popover>
	);
}
