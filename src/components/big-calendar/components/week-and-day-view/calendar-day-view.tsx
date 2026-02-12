import { mergeProps, Popover as PopoverBase } from "@base-ui/react";
import { useDndContext } from "@dnd-kit/core";
import { Time } from "@internationalized/date";
import type { VariantProps } from "class-variance-authority";
import {
	areIntervalsOverlapping,
	format,
	isToday,
	parseISO,
	startOfDay,
} from "date-fns";
import {
	ZCalendarDragData,
	ZTimeBlockOverData,
} from "@/components/big-calendar/components/dnd/dnd-schemas";
import { DropRangeRing } from "@/components/big-calendar/components/dnd/drop-range-ring";
import { DroppableDayCell } from "@/components/big-calendar/components/dnd/droppable-day-cell";
import { DroppableTimeBlock } from "@/components/big-calendar/components/dnd/droppable-time-block";
import {
	EventPopover,
	type TEventPopoverFormData,
	ZEventPopoverForm,
} from "@/components/big-calendar/components/event-popover";
import { eventBadgeVariants } from "@/components/big-calendar/components/month-view/month-event-badge";
import { CalendarTimeline } from "@/components/big-calendar/components/week-and-day-view/calendar-time-line";
import { EventBlock } from "@/components/big-calendar/components/week-and-day-view/event-block";
import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import {
	getEventBlockStyle,
	getVisibleHours,
	groupEvents,
	isWorkingHour,
} from "@/components/big-calendar/helpers";
import { useDragToCreate } from "@/components/big-calendar/hooks/use-drag-to-create";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Route } from "@/routes/_authenticated/calendar";

const MIN_DURATION_MS = 15 * 60 * 1000;

import { motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { DayViewMultiDayEventsRow } from "./day-view-multi-day-events-row";

const NEW_EVENT_TRIGGER_ID = "new-event-trigger";

interface IProps {
	singleDayEvents: TEvent[];
	multiDayEvents: TEvent[];
}

export function CalendarDayView({ singleDayEvents, multiDayEvents }: IProps) {
	const { active, over } = useDndContext();
	const activeResult = ZCalendarDragData.safeParse(active?.data.current);
	const activeData = activeResult.success ? activeResult.data : undefined;
	const overResult = ZTimeBlockOverData.safeParse(over?.data?.current);
	const overData = overResult.success ? overResult.data : undefined;
	const resizingEventId =
		activeData && activeData.type === "event-resize" ? activeData.event.id : null;
	const quickAddEventPopoverHandle = useMemo(
		() => PopoverBase.createHandle(),
		[],
	);
	const quickEventPopoverHandle = useMemo(() => PopoverBase.createHandle(), []);
	const { date: selectedDate } = Route.useSearch();
	const [workingHours] = useCalendar((s) => s.context.workingHours);
	const [badgeVariant] = useCalendar((s) => s.context.badgeVariant);
	const [newEventTitle] = useCalendar((s) => s.context.newEventTitle);
	const [newEventDescription] = useCalendar(
		(s) => s.context.newEventDescription,
	);
	const [newEventStartTime] = useCalendar((s) => s.context.newEventStartTime);
	const [, calendarStore] = useCalendar();
	const [newEventEndTime] = useCalendar((s) => s.context.newEventEndTime);

	const gridRef = useRef<HTMLDivElement>(null);

	const { hours, earliestEventHour, latestEventHour } = getVisibleHours(
		{ from: 0, to: 24 },
		singleDayEvents,
	);

	// --- Drag-to-create hook ---
	const dragToCreate = useDragToCreate({
		gridRef,
		firstHour: hours[0],
		onDragEnd: (range) => {
			calendarStore.trigger.setNewEventStartTime({
				startTime: new Time(range.startSlot.hour, range.startSlot.minute),
			});
			calendarStore.trigger.setNewEventEndTime({
				endTime: new Time(range.endSlot.hour, range.endSlot.minute, 0),
			});
			quickAddEventPopoverHandle.open(NEW_EVENT_TRIGGER_ID);
		},
		onClick: (slot) => {
			calendarStore.trigger.setNewEventStartTime({
				startTime: new Time(slot.hour, slot.minute),
			});
			const endM = slot.minute + 15;
			const endHour = endM >= 60 ? slot.hour + 1 : slot.hour;
			const endMin = endM >= 60 ? 0 : endM;
			calendarStore.trigger.setNewEventEndTime({
				endTime: new Time(endHour, endMin, 0),
			});
			quickAddEventPopoverHandle.open(NEW_EVENT_TRIGGER_ID);
		},
	});

	const formattedStartTime = useMemo(() => {
		if (!newEventStartTime) {
			return null;
		}
		return format(
			new Date(1970, 0, 1, newEventStartTime.hour, newEventStartTime.minute),
			"h:mm a",
		);
	}, [newEventStartTime]);

	const formattedEndTime = useMemo(() => {
		if (!newEventEndTime) {
			return null;
		}
		return format(
			new Date(1970, 0, 1, newEventEndTime.hour, newEventEndTime.minute),
			"h:mm a",
		);
	}, [newEventEndTime]);

	const isOpen = false;
	const activeTriggerId =
		quickAddEventPopoverHandle.store.useState("activeTriggerId");
	const isNewEventTriggerActive =
		isOpen && activeTriggerId === NEW_EVENT_TRIGGER_ID;

	const addEventColor = (
		badgeVariant === "dot" ? "gray-dot" : "gray"
	) as VariantProps<typeof eventBadgeVariants>["color"];

	const dayEvents = singleDayEvents.filter((event) => {
		const eventDate = parseISO(event.startDate);
		return (
			eventDate.getDate() === selectedDate.getDate() &&
			eventDate.getMonth() === selectedDate.getMonth() &&
			eventDate.getFullYear() === selectedDate.getFullYear()
		);
	});

	const groupedEvents = groupEvents(dayEvents);
	const newEventTime = newEventStartTime
		? { hour: newEventStartTime.hour, minute: newEventStartTime.minute }
		: { hour: 0, minute: 0 };
	const newEventEndTimeVal = newEventEndTime
		? { hour: newEventEndTime.hour, minute: newEventEndTime.minute }
		: { hour: newEventTime.hour + 1, minute: newEventTime.minute };

	const showNewEventBlock =
		!!(dragToCreate.dragPreview || (newEventStartTime && newEventEndTime)) ||
		isNewEventTriggerActive;

	// Collapse the motion.div to 0 when the block is dismissed so it doesn't
	// sit invisibly at the old position and interfere with events underneath.
	useEffect(() => {
		if (!showNewEventBlock) {
			dragToCreate.topValue.set(0);
			dragToCreate.heightValue.set(0);
		}
	}, [showNewEventBlock, dragToCreate.topValue, dragToCreate.heightValue]);

	// Time range display text for the trigger block
	const displayTimeRange = useMemo(() => {
		if (dragToCreate.dragPreview) {
			const preview = dragToCreate.dragPreview;
			const startH = preview.startSlot.hour;
			const startM = preview.startSlot.minute;
			const endH = preview.endSlot.hour;
			const endM = preview.endSlot.minute;
			return `${format(new Date(1970, 0, 1, startH, startM), "h:mm a")} – ${format(new Date(1970, 0, 1, endH, endM), "h:mm a")}`;
		}
		if (formattedStartTime && formattedEndTime) {
			return `${formattedStartTime} – ${formattedEndTime}`;
		}
		return formattedStartTime;
	}, [dragToCreate.dragPreview, formattedStartTime, formattedEndTime]);

	return (
		<>
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="shrink">
					{/* Day header (droppable for converting events to all-day) */}
					<DroppableDayCell
						cell={{
							day: selectedDate.getDate(),
							currentMonth: true,
							date: startOfDay(selectedDate),
						}}
						className="relative z-20 flex flex-col border-b"
					>
						<div className="flex">
							<div className="w-18 shrink-0"></div>
							<span className="flex flex-1 items-center justify-center border-x py-1 font-medium text-muted-foreground text-xs">
								{format(selectedDate, "EE")}{" "}
								<span
									className={cn(
										"inline-flex size-6 items-center justify-center rounded-full font-semibold text-foreground",
										isToday(selectedDate) &&
											"bg-primary font-bold text-primary-foreground",
									)}
								>
									{format(selectedDate, "d")}
								</span>
							</span>
						</div>
						<DayViewMultiDayEventsRow
							selectedDate={selectedDate}
							multiDayEvents={multiDayEvents}
							handle={quickEventPopoverHandle}
						/>
					</DroppableDayCell>
				</div>
				<ScrollArea className="h-0 flex-[1_1_0px]">
					<div className="flex">
						{/* Hours column */}
						<div className="relative w-18">
							{hours.map((hour, index) => (
								<div key={hour} className="relative" style={{ height: "96px" }}>
									<div className="absolute -top-3 right-2 flex h-6 items-center">
										{index !== 0 && (
											<span className="text-muted-foreground text-xs">
												{format(new Date().setHours(hour, 0, 0, 0), "hh a")}
											</span>
										)}
									</div>
								</div>
							))}
						</div>

						{/* Day grid */}
						<div className="relative flex-1 border-l">
							<div ref={gridRef} className="relative">
								<DropRangeRing day={selectedDate} firstHour={hours[0]} />
								{hours.map((hour, index) => {
									const isDisabled = !isWorkingHour(
										selectedDate,
										hour,
										workingHours,
									);

									return (
										<div
											key={hour}
											className={cn(
												"relative",
												isDisabled && "bg-calendar-disabled-hour",
											)}
											style={{ height: "96px" }}
										>
											{index !== 0 && (
												<div className="absolute inset-x-0 top-0 border-b"></div>
											)}

											<DroppableTimeBlock
												date={selectedDate}
												hour={hour}
												minute={0}
											>
												<button
													type="button"
													className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent"
													{...dragToCreate.getSlotProps(hour, 0)}
												/>
											</DroppableTimeBlock>

											<DroppableTimeBlock
												date={selectedDate}
												hour={hour}
												minute={15}
											>
												<button
													type="button"
													className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-accent"
													{...dragToCreate.getSlotProps(hour, 15)}
												/>
											</DroppableTimeBlock>

											<div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed"></div>

											<DroppableTimeBlock
												date={selectedDate}
												hour={hour}
												minute={30}
											>
												<button
													type="button"
													className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent"
													{...dragToCreate.getSlotProps(hour, 30)}
												/>
											</DroppableTimeBlock>

											<DroppableTimeBlock
												date={selectedDate}
												hour={hour}
												minute={45}
											>
												<button
													type="button"
													className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent"
													{...dragToCreate.getSlotProps(hour, 45)}
												/>
											</DroppableTimeBlock>
										</div>
									);
								})}

								{/* Single new-event trigger positioned at current slot */}

								<motion.div
									className={cn(
										"pointer-events-none absolute inset-x-0",
										showNewEventBlock ? "z-50" : "invisible",
									)}
									style={{
										top: dragToCreate.topValue,
										height: dragToCreate.heightValue,
									}}
								>
									<PopoverTrigger
										handle={quickAddEventPopoverHandle}
										id={NEW_EVENT_TRIGGER_ID}
										payload={ZEventPopoverForm.parse({
											mode: "create",
											startDate: selectedDate,
											allDay: false,
											startTime: new Time(
												newEventTime.hour,
												newEventTime.minute,
											),
											endTime: new Time(
												newEventEndTimeVal.hour,
												newEventEndTimeVal.minute,
												0,
											),
											title: newEventTitle,
											description: newEventDescription,
										} satisfies TEventPopoverFormData)}
										render={(triggerProps) => (
											<button
												{...mergeProps(triggerProps, {
													className: cn(
														showNewEventBlock &&
															eventBadgeVariants({
																color: addEventColor,
															}),
														"relative z-10 h-full w-full rounded-md",
														showNewEventBlock &&
															"pointer-events-auto min-h-6 cursor-pointer hover:bg-accent",
														!showNewEventBlock &&
															"pointer-events-none invisible",
													),
												})}
											>
												{showNewEventBlock ? (
													<div className="flex h-full w-full min-w-0 flex-col items-start justify-start gap-0.5 truncate px-1.5 py-1 text-xs">
														<p className="min-w-0 truncate font-semibold">
															{newEventTitle || "(No title)"}
														</p>
														{displayTimeRange ? (
															<p className="shrink-0 opacity-90">
																{displayTimeRange}
															</p>
														) : null}
													</div>
												) : null}
											</button>
										)}
									/>
								</motion.div>

								{groupedEvents.map((group, groupIndex) =>
									group.map((event) => {
										const isPreviewForThis =
											activeData?.type === "event-resize" &&
											activeData.event.id === event.id;
										const slotStartTimestamp = overData?.slotStartTimestamp;
										const displayEvent: TEvent = (() => {
											if (!isPreviewForThis || slotStartTimestamp == null)
												return event;
											if (activeData.edge === "bottom") {
												const startTs = parseISO(event.startDate).getTime();
												let endTs = slotStartTimestamp + MIN_DURATION_MS;
												if (
													endTs <= startTs ||
													endTs - startTs < MIN_DURATION_MS
												)
													endTs = startTs + MIN_DURATION_MS;
												return {
													...event,
													endDate: new Date(endTs).toISOString(),
												};
											}
											const endTs = parseISO(event.endDate).getTime();
											let startTs = slotStartTimestamp;
											if (startTs >= endTs || endTs - startTs < MIN_DURATION_MS)
												startTs = endTs - MIN_DURATION_MS;
											return {
												...event,
												startDate: new Date(startTs).toISOString(),
											};
										})();
										let style = getEventBlockStyle(
											displayEvent,
											selectedDate,
											groupIndex,
											groupedEvents.length,
											{ from: earliestEventHour, to: latestEventHour },
										);
										const hasOverlap = groupedEvents.some(
											(otherGroup, otherIndex) =>
												otherIndex !== groupIndex &&
												otherGroup.some((otherEvent) =>
													areIntervalsOverlapping(
														{
															start: parseISO(event.startDate),
															end: parseISO(event.endDate),
														},
														{
															start: parseISO(otherEvent.startDate),
															end: parseISO(otherEvent.endDate),
														},
													),
												),
										);

										if (!hasOverlap) {
											style = { ...style, width: "100%", left: "0%" };
										}

										const isResizingThis = resizingEventId === event.id;
										const isThisTheActiveEvent =
											activeData?.event?.id === event.id;
										// When any drag is active, disable pointer on all other events so only time blocks receive drop.
										const isOtherBeingDraggedOrResized =
											active != null && !isThisTheActiveEvent;
										// Earlier start = higher z-index so the event on top receives the click when overlapping.
										// Keep max below popover (z-50): use 10–40 so popover always stays on top.
										const startMs = parseISO(event.startDate).getTime();
										const orderValue =
											(86400000 - (startMs % 86400000)) / 86400000;
										const zIndex =
											10 + Math.min(39, Math.floor(orderValue * 40));
										return (
											<div
												key={event.id}
												className="absolute p-1"
												style={{
													...style,
													zIndex,
													pointerEvents:
														isResizingThis || isOtherBeingDraggedOrResized
															? "none"
															: undefined,
												}}
											>
												<EventBlock
													event={displayEvent}
													originalEvent={event}
													handle={quickAddEventPopoverHandle}
												/>
											</div>
										);
									}),
								)}
							</div>

							<CalendarTimeline
								firstVisibleHour={earliestEventHour}
								lastVisibleHour={latestEventHour}
							/>
						</div>
					</div>
				</ScrollArea>
			</div>
			<EventPopover handle={quickAddEventPopoverHandle} />
		</>
	);
}
