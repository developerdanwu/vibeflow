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
import { useCalendar } from "@/routes/_authenticated/calendar/-components/calendar/contexts/calendar-context";
import {
	type TEvent,
	ZEventSchema,
} from "@/routes/_authenticated/calendar/-components/calendar/core/interfaces";
import type { TEventColor } from "@/routes/_authenticated/calendar/-components/calendar/core/types";
import { useCreateEventMutation } from "@/routes/_authenticated/calendar/-components/calendar/hooks/use-create-event-mutation";
import { useDeleteEventMutation } from "@/routes/_authenticated/calendar/-components/calendar/hooks/use-delete-event-mutation";
import { useUpdateEventMutation } from "@/routes/_authenticated/calendar/-components/calendar/hooks/use-update-event-mutation";
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
	Repeat,
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
import { EventFormBodySection } from "./event-form-body";
import {
	eventFormOptions,
	getCreateDefaultValues,
	type TEventFormData,
} from "./form-options";
import { buildRecurrenceRruleStrings } from "./recurrence-rrule";
import { RelatedTasksSection } from "./related-tasks-section";

const colorNameToHex: Record<TEventColor, string> = {
	blue: "#3B82F6",
	green: "#22C55E",
	red: "#EF4444",
	yellow: "#EAB308",
	purple: "#A855F7",
	orange: "#F97316",
	gray: "#6B7280",
};

const RECURRENCE_OPTIONS: Array<{
	value: "none" | "daily" | "weekly" | "monthly";
	label: string;
}> = [
	{ value: "none", label: "Does not repeat" },
	{ value: "daily", label: "Daily" },
	{ value: "weekly", label: "Weekly" },
	{ value: "monthly", label: "Monthly" },
];

/** Sentinel for "use calendar color" in edit mode; submit sends clearColor and omits color. */
const USE_CALENDAR_COLOR_SENTINEL: string | null = null;

function calendarColorToHex(cal: { color: string } | undefined): string {
	if (!cal) return "#3B82F6";
	return /^#[0-9A-Fa-f]{6}$/.test(cal.color)
		? cal.color
		: (colorNameToHex[cal.color as TEventColor] ?? "#3B82F6");
}

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

export {
	eventFormOptions,
	eventFormSchema,
	getCreateDefaultValues,
	type GetCreateDefaultValuesInput,
	type TEventFormData,
} from "./form-options";

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

/** If event is recurring, open dialog and run onConfirm(mode); else run action() (and await if Promise). */
function withRecurringDialog(
	event: TEvent,
	action: (recurringEditMode?: "this" | "all") => void | Promise<void>,
	opts: { onConfirm: (mode: "this" | "all") => void; onCancel?: () => void },
): void | Promise<void> {
	if (event.recurringEventId) {
		dialogStore.send({
			type: "openRecurringEventDialog",
			onConfirm: opts.onConfirm,
			onCancel: opts.onCancel ?? (() => {}),
		});
		return;
	}
	return action();
}

function buildDateTimePayload(
	values: TEventFormData,
):
	| { allDay: true; startDateStr: string; endDateStr: string }
	| { allDay: false; startTimestamp: number; endTimestamp: number } {
	const startTimeVal = values.startTime ?? new Time(9, 0);
	const endTimeVal = values.endTime ?? new Time(10, 0);
	if (values.allDay) {
		return {
			allDay: true,
			startDateStr: format(values.startDate, "yyyy-MM-dd"),
			endDateStr: format(addDays(values.endDate, 1), "yyyy-MM-dd"),
		};
	}
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
	return {
		allDay: false,
		startTimestamp: startDateTime.getTime(),
		endTimestamp: endDateTime.getTime(),
	};
}

export type EventPopoverContentHandle = {
	runAfterClose: () => void;
};

type PopoverPlacement = Pick<
	React.ComponentProps<typeof PopoverContent>,
	"side" | "align" | "sideOffset" | "alignOffset" | "collisionAvoidance"
>;

interface EventPopoverContentProps extends PopoverPlacement {
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
	{
		onClose,
		initialValues,
		mode = "create",
		event,
		isLoadingRelatedTasks,
		side = "right",
		align = "start",
		sideOffset,
		alignOffset,
		collisionAvoidance,
	},
	ref,
) {
	const formId = useId();
	const titleId = useId();
	const refs = useRef({
		titleInput: null as HTMLInputElement | null,
		userHasSetColor: false,
		form: null as HTMLFormElement | null,
		runAfterClose: null as (() => void) | null,
	});

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
		const eventId = event.convexId as Id<"events">;
		withRecurringDialog(
			event,
			() => {
				refs.current.runAfterClose = () => deleteEvent({ id: eventId });
				onClose();
			},
			{
				onConfirm: () => {
					deleteEvent({ id: eventId });
					onClose();
				},
			},
		);
	};

	const performSubmit = async (
		values: TEventFormData,
		recurringEditMode?: "this" | "all",
	) => {
		try {
			const useCalendarColor =
				mode === "edit" && values.color === USE_CALENDAR_COLOR_SENTINEL;
			const colorHex =
				values.color && values.color !== USE_CALENDAR_COLOR_SENTINEL
					? values.color
					: "#3B82F6";

			const taskLinks = values.relatedTaskLinks ?? [];
			const taskLinkUpdates =
				values.eventKind === "task"
					? { scheduledTaskLinks: taskLinks, relatedTaskLinks: [] }
					: { scheduledTaskLinks: [], relatedTaskLinks: taskLinks };
			const dateTime = buildDateTimePayload(values);

			if (mode === "edit" && event?.convexId) {
				const eventId = event.convexId as Id<"events">;
				await updateEvent({
					id: eventId,
					title: values.title,
					description: values.description || "",
					calendarId: values.calendarId,
					busy: values.busy,
					visibility: values.visibility,
					eventKind: values.eventKind,
					recurringEditMode,
					...taskLinkUpdates,
					...(useCalendarColor
						? { clearColor: true as const }
						: { color: colorHex }),
					...dateTime,
				});
			} else {
				const selectedCalendarForCreate = calendars?.find(
					(cal) => cal.id === values.calendarId,
				);
				const createColorHex =
					values.color && values.color !== USE_CALENDAR_COLOR_SENTINEL
						? values.color
						: calendarColorToHex(selectedCalendarForCreate);
				const eventStart =
					values.allDay || !values.startTime
						? startOfDay(values.startDate)
						: set(startOfDay(values.startDate), {
								hours: values.startTime.hour,
								minutes: values.startTime.minute,
								seconds: 0,
								milliseconds: 0,
							});
				const recurrence = buildRecurrenceRruleStrings({
					recurrenceRule: values.recurrenceRule ?? "none",
					recurrenceEnd: values.recurrenceEnd ?? "never",
					recurrenceEndDate: values.recurrenceEndDate,
					recurrenceCount: values.recurrenceCount,
					eventStart,
				});
				await createEvent({
					title: values.title,
					description: values.description || "",
					color: createColorHex,
					calendarId: values.calendarId,
					busy: values.busy,
					visibility: values.visibility,
					eventKind: values.eventKind,
					...(values.eventKind === "task"
						? { scheduledTaskLinks: taskLinks, relatedTaskLinks: [] }
						: { relatedTaskLinks: taskLinks }),
					...dateTime,
					...(recurrence.length > 0 ? { recurrence } : {}),
				});
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
			if (mode === "edit" && event) {
				const result = withRecurringDialog(event, () => performSubmit(values), {
					onConfirm: async (recurringEditMode) => {
						await performSubmit(values, recurringEditMode);
						onClose();
					},
				});
				if (result !== undefined) await result;
				return;
			}
			await performSubmit(values);
		},
	});
	const isDirty = useStore(form.store, (state) => state.isDirty);

	// Sync store → form when resize handles change the event times (create mode only)
	useEffect(() => {
		if (mode !== "create") return;
		if (storeStartTime) {
			const current = form.getFieldValue("startTime") as Time | undefined;
			if (
				!current ||
				current.hour !== storeStartTime.hour ||
				current.minute !== storeStartTime.minute
			) {
				form.setFieldValue("startTime", storeStartTime);
			}
		}
		if (storeEndTime) {
			const current = form.getFieldValue("endTime") as Time | undefined;
			if (
				!current ||
				current.hour !== storeEndTime.hour ||
				current.minute !== storeEndTime.minute
			) {
				form.setFieldValue("endTime", storeEndTime);
			}
		}
	}, [storeStartTime, storeEndTime, mode, form]);

	useImperativeHandle(
		ref,
		() => ({
			runAfterClose: () => {
				const runAfter = refs.current.runAfterClose;
				if (runAfter) {
					runAfter();
					refs.current.runAfterClose = null;
				} else if (isDirty) {
					refs.current.form?.requestSubmit();
				}
				calendarStore.trigger.resetNewEvent();
			},
		}),
		[isDirty, calendarStore],
	);

	return (
		<PopoverContent
			className="w-[480px] p-0"
			side={side}
			align={align}
			sideOffset={sideOffset}
			alignOffset={alignOffset}
			collisionAvoidance={collisionAvoidance}
			backdrop
		>
			<form
				ref={(el) => {
					refs.current.form = el;
				}}
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
						{mode === "create" && (
							<form.Subscribe selector={(state) => state.values.eventKind}>
								{(eventKind) =>
									eventKind === "event" && (
										<form.AppField name="recurrenceRule">
											{(field) => {
												const current = field.state.value ?? "none";
												const selectedOption =
													RECURRENCE_OPTIONS.find((o) => o.value === current) ??
													RECURRENCE_OPTIONS[0];
												return (
													<Combobox
														items={RECURRENCE_OPTIONS}
														value={selectedOption}
														onValueChange={(option) => {
															if (option) {
																field.handleChange(option.value);
															}
														}}
														itemToStringValue={(item) => item.value}
														itemToStringLabel={(item) => item.label}
														isItemEqualToValue={(a, b) => a.value === b.value}
													>
														<Tooltip disableHoverablePopup>
															<TooltipTrigger
																render={
																	<ComboboxTrigger
																		render={
																			<Button variant="outline" size="icon-xs">
																				<Repeat />
																			</Button>
																		}
																	/>
																}
															/>
															<TooltipContent>
																{selectedOption.label}
															</TooltipContent>
														</Tooltip>
														<ComboboxContent width="min" className="min-w-34">
															<ComboboxInput
																showFocusRing={false}
																placeholder="Type recurrence"
																showTrigger={false}
															/>
															<ComboboxEmpty>No options found</ComboboxEmpty>
															<ComboboxList>
																{(option) => (
																	<ComboboxItem
																		key={option.value}
																		value={option}
																	>
																		{option.label}
																	</ComboboxItem>
																)}
															</ComboboxList>
														</ComboboxContent>
													</Combobox>
												);
											}}
										</form.AppField>
									)
								}
							</form.Subscribe>
						)}
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
						{(field) => (
							<div className="flex shrink-0 items-center gap-2">
								<p className="text-muted-foreground text-xs">All Day</p>
								<Switch
									size="sm"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							</div>
						)}
					</form.AppField>
				</div>
				<Separator />
				<div className="flex flex-wrap items-center gap-2 px-2 py-1">
					<form.Subscribe
						selector={(state) => ({
							color: state.values.color,
							calendarId: state.values.calendarId,
						})}
					>
						{({ color, calendarId }) => {
							const selectedCalendar = calendars?.find(
								(cal) => cal.id === calendarId,
							);
							const displayColor =
								color && color !== USE_CALENDAR_COLOR_SENTINEL
									? color
									: calendarColorToHex(selectedCalendar);
							return (
								<form.AppField name="color">
									{(field) => (
										<>
											<ColorPickerCompact
												value={displayColor}
												onChange={(hex) => {
													if (mode === "create") {
														refs.current.userHasSetColor = true;
													}
													field.handleChange(hex);
												}}
											/>
											{(mode === "edit" ||
												(mode === "create" && selectedCalendar)) && (
												<Button
													type="button"
													variant="link"
													size="xs"
													className="shrink-0 text-muted-foreground text-xs"
													onClick={() => {
														if (mode === "create") {
															refs.current.userHasSetColor = false;
														}
														field.handleChange(USE_CALENDAR_COLOR_SENTINEL);
													}}
												>
													Use calendar color
													{selectedCalendar && (
														<span className="ml-1">
															({selectedCalendar.color})
														</span>
													)}
												</Button>
											)}
										</>
									)}
								</form.AppField>
							);
						}}
					</form.Subscribe>
					<form.AppField
						name="title"
						listeners={{
							onMount: ({ value }) => {
								if (mode === "create") {
									refs.current.titleInput?.focus();
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
									ref={(el) => {
										refs.current.titleInput = el;
									}}
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
											if (
												mode === "create" &&
												!refs.current.userHasSetColor &&
												value
											) {
												// Keep "use calendar color" (sentinel) when switching calendar so submit uses new calendar's color
												const currentColor = form.getFieldValue("color") as
													| string
													| null;
												form.setFieldValue(
													"color",
													currentColor === USE_CALENDAR_COLOR_SENTINEL
														? USE_CALENDAR_COLOR_SENTINEL
														: calendarColorToHex(value),
												);
											}
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
	side,
	align,
	sideOffset,
	alignOffset,
	collisionAvoidance,
}: {
	event: TEvent;
	onClose: () => void;
	contentRef: React.RefObject<EventPopoverContentHandle | null>;
	openId: number;
} & PopoverPlacement) {
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
		color:
			event.color && /^#[0-9A-Fa-f]{6}$/.test(event.color)
				? event.color
				: "#3B82F6",
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
			side={side}
			align={align}
			sideOffset={sideOffset}
			alignOffset={alignOffset}
			collisionAvoidance={collisionAvoidance}
		/>
	);
}

export function EventPopover({
	handle,
	side = "right",
	align = "start",
	sideOffset,
	alignOffset,
	collisionAvoidance,
}: {
	handle: NonNullable<PopoverRootProps["handle"]>;
} & Partial<PopoverPlacement>) {
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

	return (
		<Popover
			open={isOpen}
			onOpenChange={(open) => {
				if (open) onOpen();
				else onClose();
			}}
			handle={handle}
			onOpenChangeComplete={(open) => {
				if (!open) contentRef.current?.runAfterClose();
			}}
		>
			{({ payload: _payload }) => {
				const payload = _payload as TEventPopoverPayload;
				if (!payload) return null;
				if (payload.mode === "edit") {
					return (
						<EditEventPopoverContent
							event={payload.event}
							onClose={onClose}
							contentRef={contentRef}
							openId={openId}
							side={side}
							align={align}
							sideOffset={sideOffset}
							alignOffset={alignOffset}
							collisionAvoidance={collisionAvoidance}
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
							color: calendarColorToHex(defaultCalendar),
						})}
						mode="create"
						onClose={onClose}
						isLoadingRelatedTasks={false}
						side={side}
						align={align}
						sideOffset={sideOffset}
						alignOffset={alignOffset}
						collisionAvoidance={collisionAvoidance}
					/>
				);
			}}
		</Popover>
	);
}
