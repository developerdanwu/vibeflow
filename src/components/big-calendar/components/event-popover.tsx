"use client";

import { EventFormBodySection } from "@/components/big-calendar/components/event-popover/event-form-body";
import {
	eventFormOptions,
	getCreateDefaultValues,
	type TEventFormData,
} from "@/components/big-calendar/components/event-popover/form-options";
import { RelatedTasksSection } from "@/components/big-calendar/components/event-popover/related-tasks-section";
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
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "@/components/ui/combobox";
import { DayPicker } from "@/components/ui/day-picker";
import { Field, FieldError } from "@/components/ui/field";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { TimeInput } from "@/components/ui/time-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDisclosure } from "@/hooks/use-disclosure";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { dialogStore } from "@/lib/dialog-store";
import type { PopoverRootProps } from "@base-ui/react";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Time } from "@internationalized/date";
import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, parseISO, set, startOfDay, subDays } from "date-fns";
import {
	Briefcase,
	BriefcaseBusiness,
	CalendarIcon,
	ClipboardCheck,
	Eye,
	EyeOff,
	InfoIcon,
	Trash2,
} from "lucide-react";
import {
	forwardRef,
	useEffect,
	useId,
	useImperativeHandle,
	useRef,
} from "react";
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

export {
	eventFormOptions,
	eventFormSchema,
	getCreateDefaultValues,
	type GetCreateDefaultValuesInput,
	type TEventFormData,
} from "@/components/big-calendar/components/event-popover/form-options";

type EventPopoverMode = "create" | "edit";

function getTimes(
	event: TEvent,
	startDate: Date,
	rawEndDate: Date,
): { startTime: Time | undefined; endTime: Time | undefined } {
	if (!event.allDay) {
		// Derive times from Date objects (already in local timezone from parseISO)
		return {
			startTime: new Time(startDate.getHours(), startDate.getMinutes()),
			endTime: new Time(rawEndDate.getHours(), rawEndDate.getMinutes()),
		};
	}
	return { startTime: undefined, endTime: undefined };
}

export type EventPopoverContentHandle = {
	runAfterClose: () => void;
};

interface EventPopoverContentProps {
	onClose: () => void;
	initialValues: TEventFormData;
	mode?: EventPopoverMode;
	event?: TEvent;
	isLoadingRelatedTasks: boolean;
}

const EventPopoverContent = forwardRef<
	EventPopoverContentHandle,
	EventPopoverContentProps
>(function EventPopoverContent(
	{ onClose, initialValues, mode = "create", event, isLoadingRelatedTasks },
	ref,
) {
	const formId = useId();
	const titleId = useId();
	const titleInputRef = useRef<HTMLInputElement | null>(null);

	const { mutateAsync: updateEvent } = useUpdateEventMutation({
		meta: { updateType: "edit" },
	});
	const { mutateAsync: createEvent } = useCreateEventMutation();
	const { mutate: deleteEvent } = useDeleteEventMutation();
	const [_, calendarStore] = useCalendar();
	const [storeStartTime] = useCalendar((s) => s.context.newEventStartTime);
	const [storeEndTime] = useCalendar((s) => s.context.newEventEndTime);

	// Fetch all user calendars (local + Google)
	const { data: calendars } = useQuery(
		convexQuery(api.calendars.queries.getAllUserCalendars),
	);

	const eventIdForLinks =
		mode === "edit" && event?.convexId
			? (event.convexId as Id<"events">)
			: undefined;
	const handleDelete = () => {
		if (!event?.convexId) return;
		// Check if recurring event needs dialog
		if (event.recurringEventId) {
			dialogStore.send({
				type: "openRecurringEventDialog",
				onConfirm: () => {
					// Note: recurringEditMode not needed for delete yet, but can be added later
					deleteEvent({ id: event.convexId as Id<"events"> });
					onClose();
				},
				onCancel: () => {},
			});
			return;
		}
		// Not recurring, delete directly
		runAfterCloseRef.current = () => {
			deleteEvent({ id: event.convexId as Id<"events"> });
		};
		onClose();
	};

	const performSubmit = async (
		values: TEventFormData,
		recurringEditMode?: "this" | "all",
	) => {
		try {
			const colorName = values.color ? hexToColorName(values.color) : "blue";

			if (mode === "edit" && event?.convexId) {
				const eventId = event.convexId as Id<"events">;
				const taskLinks = values.relatedTaskLinks ?? [];
				const taskLinkUpdates =
					values.eventKind === "task"
						? { scheduledTaskLinks: taskLinks, relatedTaskLinks: [] }
						: { scheduledTaskLinks: [], relatedTaskLinks: taskLinks };
				if (values.allDay) {
					await updateEvent({
						id: eventId,
						title: values.title,
						description: values.description || "",
						allDay: true,
						startDateStr: format(values.startDate, "yyyy-MM-dd"),
						endDateStr: format(addDays(values.endDate, 1), "yyyy-MM-dd"),
						color: colorName,
						calendarId: values.calendarId,
						busy: values.busy,
						visibility: values.visibility,
						eventKind: values.eventKind,
						recurringEditMode,
						...taskLinkUpdates,
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
						id: eventId,
						title: values.title,
						description: values.description || "",
						allDay: false,
						startTimestamp: startDateTime.getTime(),
						endTimestamp: endDateTime.getTime(),
						color: colorName,
						calendarId: values.calendarId,
						busy: values.busy,
						visibility: values.visibility,
						eventKind: values.eventKind,
						recurringEditMode,
						...taskLinkUpdates,
					});
				}
			} else {
				const taskLinks = values.relatedTaskLinks ?? [];
				const createPayload = {
					title: values.title,
					description: values.description || "",
					color: colorName,
					calendarId: values.calendarId,
					busy: values.busy,
					visibility: values.visibility,
					eventKind: values.eventKind,
					...(values.eventKind === "task"
						? { scheduledTaskLinks: taskLinks, relatedTaskLinks: [] }
						: { relatedTaskLinks: taskLinks }),
				};
				if (values.allDay) {
					await createEvent({
						...createPayload,
						allDay: true,
						startDateStr: format(values.startDate, "yyyy-MM-dd"),
						endDateStr: format(addDays(values.endDate, 1), "yyyy-MM-dd"),
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
						...createPayload,
						allDay: false,
						startTimestamp: startDateTime.getTime(),
						endTimestamp: endDateTime.getTime(),
					});
				}
			}

			form.reset();
			calendarStore.trigger.resetNewEvent();
		} catch (error) {
			const message = getConvexErrorMessage(
				error,
				`Failed to ${mode === "edit" ? "update" : "create"} event`,
			);
			toast.error(message);
			console.error(
				`Failed to ${mode === "edit" ? "update" : "create"} event:`,
				error,
			);
		}
	};

	const form = useAppForm({
		...eventFormOptions,
		defaultValues: initialValues,
		onSubmit: async ({ value }) => {
			const values = value as TEventFormData;
			// Check if this is a recurring event that needs user choice
			if (mode === "edit" && event?.recurringEventId) {
				dialogStore.send({
					type: "openRecurringEventDialog",
					onConfirm: async (recurringEditMode) => {
						await performSubmit(values, recurringEditMode);
						onClose();
					},
					onCancel: () => {},
				});
				return;
			}
			// Not recurring, submit directly
			await performSubmit(values);
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
					e.preventDefault();
					form.handleSubmit();
				}}
				className="grid"
			>
				<form.AppField name="eventKind">
					{(field) => {
						const eventKind = field.state.value;
						return (
							<ToggleGroup
								value={eventKind ? [eventKind] : []}
								onValueChange={(v: string[]) => {
									const first = v?.[0];
									if (first != null) {
										field.handleChange(first as "event" | "task");
									}
								}}
								className="absolute -top-9 left-0"
								variant="outline"
								size="xs"
							>
								<ToggleGroupItem
									value="task"
									className="flex w-max gap-1.5 bg-background"
								>
									<ClipboardCheck className="size-4 shrink-0" />
									<span className="text-xs">Task</span>
								</ToggleGroupItem>
								<ToggleGroupItem
									value="event"
									className="flex w-max gap-1.5 bg-background"
								>
									<CalendarIcon className="size-4 shrink-0" />
									<span className="text-xs">Event</span>
								</ToggleGroupItem>
							</ToggleGroup>
						);
					}}
				</form.AppField>
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

						<form.AppField name="endDate">
							{({ state, handleChange }) => {
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
								if (mode === "create") {
									titleInputRef.current?.focus();
								}
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
									ref={titleInputRef}
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
				<form.Subscribe selector={(state) => state.values.eventKind}>
					{(eventKind) => (
						<>
							{eventKind === "event" && (
								<EventFormBodySection
									form={form}
									eventIdForLinks={eventIdForLinks}
									isLoadingRelatedTasks={isLoadingRelatedTasks}
								/>
							)}
							{eventKind === "task" && (
								<>
									<Separator />
									<RelatedTasksSection
										form={form}
										eventIdForLinks={eventIdForLinks}
										variant="task"
										isLoadingRelatedTasks={isLoadingRelatedTasks}
									/>
								</>
							)}
							<Separator />
						</>
					)}
				</form.Subscribe>
				<div className="flex items-center gap-2 px-2 py-2">
					<form.AppField name="calendarId">
						{(field) => {
							const selectedCalendar = calendars?.find(
								(cal) => cal.id === field.state.value,
							);
							return (
								<div className="w-full">
									<Combobox
										items={calendars ?? []}
										value={selectedCalendar ?? null}
										onValueChange={(value) => {
											field.handleChange(value === null ? undefined : value.id);
										}}
										itemToStringValue={(item) => item.id}
										itemToStringLabel={(item) => item.name}
										isItemEqualToValue={(item, value) => item.id === value.id}
									>
										<ComboboxTrigger
											render={
												<Button
													startIcon={<CalendarIcon />}
													variant="outline"
													size={"xs"}
												>
													{selectedCalendar ? (
														<div className="flex items-center gap-2">
															<div
																className="h-3 w-3 shrink-0 rounded-full"
																style={{
																	backgroundColor: selectedCalendar.color,
																}}
															/>
															<span>{selectedCalendar.name}</span>
															{selectedCalendar.isGoogle && (
																<span className="text-muted-foreground text-xs">
																	Google
																</span>
															)}
														</div>
													) : (
														<span className="text-muted-foreground">
															Select calendar
														</span>
													)}
												</Button>
											}
										/>
										<ComboboxContent width="min">
											<ComboboxInput
												showFocusRing={false}
												placeholder="Type calendar name"
												showTrigger={false}
											/>
											<ComboboxEmpty>No calendars found</ComboboxEmpty>
											<ComboboxList>
												{(calendar) => (
													<ComboboxItem key={calendar.id} value={calendar}>
														<div className="flex items-center gap-2">
															<div
																className="h-3 w-3 shrink-0 rounded-full"
																style={{ backgroundColor: calendar.color }}
															/>
															<span className="flex-1">{calendar.name}</span>
															{calendar.isGoogle && (
																<span className="text-muted-foreground text-xs">
																	Google
																</span>
															)}
														</div>
													</ComboboxItem>
												)}
											</ComboboxList>
										</ComboboxContent>
									</Combobox>
								</div>
							);
						}}
					</form.AppField>
					<form.AppField name="busy">
						{(field) => {
							// Treat undefined as "free" for display purposes
							const currentValue = field.state.value ?? "free";
							const isBusy = currentValue === "busy";
							const tooltipText = isBusy ? "Busy" : "Free";
							return (
								<Tooltip>
									<TooltipTrigger
										render={
											<Button
												type="button"
												variant="outline"
												size="icon-sm"
												onClick={() => {
													// Toggle between "busy" and "free"
													field.handleChange(isBusy ? "free" : "busy");
												}}
												aria-label={tooltipText}
											>
												{isBusy ? <Briefcase /> : <BriefcaseBusiness />}
											</Button>
										}
									/>
									<TooltipContent>{tooltipText}</TooltipContent>
								</Tooltip>
							);
						}}
					</form.AppField>
					<form.AppField name="visibility">
						{(field) => {
							const isPrivate = field.state.value === "private";
							const tooltipText = isPrivate ? "Private" : "Public";
							return (
								<Tooltip>
									<TooltipTrigger
										render={
											<Button
												type="button"
												variant="outline"
												size="icon-sm"
												onClick={() => {
													field.handleChange(isPrivate ? "public" : "private");
												}}
												aria-label={tooltipText}
											>
												{isPrivate ? <EyeOff /> : <Eye />}
											</Button>
										}
									/>
									<TooltipContent>{tooltipText}</TooltipContent>
								</Tooltip>
							);
						}}
					</form.AppField>
				</div>
			</form>
		</PopoverContent>
	);
});

/**
 * Edit mode wrapper: fetches related task links then renders the form with
 * async initial values (TanStack Form async initial values pattern).
 */
function EditEventPopoverContent({
	event,
	onClose,
	contentRef,
	openId,
}: {
	event: TEvent;
	onClose: () => void;
	contentRef: React.RefObject<EventPopoverContentHandle | null>;
	openId: number;
}) {
	const { data: linkedTasks, isLoading } = useQuery({
		...convexQuery(api.eventTaskLinks.queries.getLinksByEventId, {
			eventId: event.id as Id<"events">,
		}),
		enabled: true,
	});
	const startDate = parseISO(event.startDate);
	const rawEndDate = parseISO(event.endDate);
	const endDate = event.allDay ? subDays(rawEndDate, 1) : rawEndDate;
	const { startTime, endTime } = getTimes(event, startDate, rawEndDate);

	const relatedTaskLinks = (linkedTasks ?? [])
		.filter(
			(l) =>
				l.linkType === (event.eventKind === "task" ? "scheduled" : "related"),
		)
		.map((l) => ({ externalTaskId: l.externalTaskId, url: l.url }));
	const initialValues = getCreateDefaultValues({
		startDate,
		endDate,
		startTime,
		endTime,
		title: event.title,
		description: event.description ?? "",
		allDay: event.allDay,
		color: colorNameToHex[event.color] ?? "#3B82F6",
		calendarId: event.calendarId as Id<"calendars"> | undefined,
		busy: event.busy,
		visibility: event.visibility,
		eventKind: event.eventKind ?? "event",
		relatedTaskLinks,
	});
	return (
		<EventPopoverContent
			ref={contentRef}
			key={`edit-${event.id}-${openId}`}
			initialValues={initialValues}
			mode="edit"
			isLoadingRelatedTasks={isLoading}
			event={event}
			onClose={onClose}
		/>
	);
}

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

	// Fetch calendars to get default calendar for create mode
	const { data: calendars } = useQuery(
		convexQuery(api.calendars.queries.getAllUserCalendars),
	);
	const defaultCalendar = calendars?.find((cal) => cal.isDefault);

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
					return (
						<EditEventPopoverContent
							event={payload.event}
							onClose={handleClose}
							contentRef={contentRef}
							openId={openId}
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
							calendarId: defaultCalendar?.id as Id<"calendars"> | undefined,
						})}
						mode="create"
						onClose={handleClose}
						isLoadingRelatedTasks={false}
					/>
				);
			}}
		</Popover>
	);
}
