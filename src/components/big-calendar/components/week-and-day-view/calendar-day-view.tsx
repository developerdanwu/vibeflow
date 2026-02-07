import { ZCalendarDragData } from "@/components/big-calendar/components/dnd/dnd-schemas";
import { isEventResizeData } from "@/components/big-calendar/components/dnd/draggable-event";
import { DropRangeRing } from "@/components/big-calendar/components/dnd/drop-range-ring";
import { DroppableTimeBlock } from "@/components/big-calendar/components/dnd/droppable-time-block";
import {
	EventPopover,
	type TEventPopoverFormData,
	ZEventPopoverForm,
} from "@/components/big-calendar/components/event-popover";
import { eventBadgeVariants } from "@/components/big-calendar/components/month-view/month-event-badge";
import { CalendarTimeline } from "@/components/big-calendar/components/week-and-day-view/calendar-time-line";
import { DayViewMultiDayEventsRow } from "@/components/big-calendar/components/week-and-day-view/day-view-multi-day-events-row";
import { EventBlock } from "@/components/big-calendar/components/week-and-day-view/event-block";
import {
	useCalendar,
	useCalendarDay,
} from "@/components/big-calendar/contexts/calendar-context";
import {
	getEventBlockStyle,
	getVisibleHours,
	groupEvents,
	isWorkingHour,
} from "@/components/big-calendar/helpers";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Route } from "@/routes/_authenticated/calendar";
import { Popover as PopoverBase } from "@base-ui/react";
import { useDndContext } from "@dnd-kit/core";
import { Time } from "@internationalized/date";
import type { VariantProps } from "class-variance-authority";
import { areIntervalsOverlapping, format, isToday, parseISO } from "date-fns";

const MIN_DURATION_MS = 15 * 60 * 1000;

import { useEffect, useMemo, useRef } from "react";

const NEW_EVENT_TRIGGER_ID = "new-event-trigger";
const SLOT_HEIGHT_PX = 24;

interface IProps {
	singleDayEvents: TEvent[];
	multiDayEvents: TEvent[];
}

export function CalendarDayView({ singleDayEvents, multiDayEvents }: IProps) {
	const { active } = useDndContext();
	const activeResult = ZCalendarDragData.safeParse(active?.data.current);
	const activeData = activeResult.success ? activeResult.data : undefined;
	const resizingEventId =
		activeData && isEventResizeData(activeData) ? activeData.event.id : null;
	const quickAddEventPopoverHandle = useMemo(
		() => PopoverBase.createHandle(),
		[],
	);
	const openPendingRef = useRef(false);
	const { date: selectedDate } = Route.useSearch();
	const [workingHours] = useCalendar((s) => s.context.workingHours);
	const [badgeVariant] = useCalendar((s) => s.context.badgeVariant);
	const [newEventTitle] = useCalendar((s) => s.context.newEventTitle);
	const [newEventDescription] = useCalendar(
		(s) => s.context.newEventDescription,
	);
	const [newEventStartTime] = useCalendar((s) => s.context.newEventStartTime);
	const [newEventAllDay] = useCalendar((s) => s.context.newEventAllDay);
	const [resizePreview] = useCalendarDay((s) => s.context.resizePreview);
	const [, calendarStore] = useCalendar();

	useEffect(() => {
		if (openPendingRef.current && newEventStartTime) {
			quickAddEventPopoverHandle.open(NEW_EVENT_TRIGGER_ID);
			openPendingRef.current = false;
		}
	}, [newEventStartTime, quickAddEventPopoverHandle]);

	const formattedStartTime = useMemo(() => {
		if (!newEventStartTime) return null;
		return format(
			new Date(1970, 0, 1, newEventStartTime.hour, newEventStartTime.minute),
			"h:mm a",
		);
	}, [newEventStartTime]);

	const isOpen = quickAddEventPopoverHandle.store.useState("open");
	const activeTriggerId =
		quickAddEventPopoverHandle.store.useState("activeTriggerId");
	const isNewEventTriggerActive =
		isOpen && activeTriggerId === NEW_EVENT_TRIGGER_ID;

	const handleSlotClick = (hour: number, minute: number) => {
		calendarStore.trigger.setNewEventStartTime({
			startTime: new Time(hour, minute),
		});
		calendarStore.trigger.setNewEventEndTime({
			endTime: new Time(hour + 1, minute, 0),
		});
		quickAddEventPopoverHandle.open(NEW_EVENT_TRIGGER_ID);
	};

	const addEventColor = (
		badgeVariant === "dot" ? "gray-dot" : "gray"
	) as VariantProps<typeof eventBadgeVariants>["color"];

	const { hours, earliestEventHour, latestEventHour } = getVisibleHours(
		{ from: 0, to: 24 },
		singleDayEvents,
	);

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

	return (
		<>
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="shrink-0">
					<DayViewMultiDayEventsRow
						selectedDate={selectedDate}
						multiDayEvents={multiDayEvents}
						handle={quickAddEventPopoverHandle}
					/>

					{/* Day header */}
					<div className="relative z-20 flex border-b">
						<div className="w-18"></div>
						<span className="flex-1 border-l py-2 text-center font-medium text-muted-foreground text-xs">
							{format(selectedDate, "EE")}{" "}
							<span
								className={cn(
									"inline-flex size-7 items-center justify-center rounded-full font-semibold text-foreground",
									isToday(selectedDate) &&
										"bg-primary font-bold text-primary-foreground",
								)}
							>
								{format(selectedDate, "d")}
							</span>
						</span>
					</div>
				</div>
				<ScrollArea className="h-0 flex-[1_1_0px]" type="auto">
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
							<div className="relative">
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
												<div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>
											)}

											<DroppableTimeBlock
												date={selectedDate}
												hour={hour}
												minute={0}
											>
												<button
													type="button"
													className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent"
													onClick={(e) => {
														e.stopPropagation();
														handleSlotClick(hour, 0);
													}}
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
													onClick={(e) => {
														e.stopPropagation();
														handleSlotClick(hour, 15);
													}}
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
													onClick={(e) => {
														e.stopPropagation();
														handleSlotClick(hour, 30);
													}}
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
													onClick={(e) => {
														e.stopPropagation();
														handleSlotClick(hour, 45);
													}}
												/>
											</DroppableTimeBlock>
										</div>
									);
								})}

								{/* Single new-event trigger positioned at current slot */}
								<div
									className="pointer-events-none absolute inset-x-0"
									style={{
										top:
											((newEventStartTime?.hour ?? 0) * 4 +
												(newEventStartTime?.minute ?? 0) / 15) *
											SLOT_HEIGHT_PX,
										height: SLOT_HEIGHT_PX,
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
												newEventTime.hour,
												newEventTime.minute + 15,
												0,
											),
											title: newEventTitle,
											description: newEventDescription,
										} satisfies TEventPopoverFormData)}
										nativeButton={false}
										render={({ className, ...props }) => (
											<button
												type="button"
												className={cn(
													isNewEventTriggerActive &&
														eventBadgeVariants({
															color: addEventColor,
														}),
													"absolute inset-x-0 top-0 h-[24px] w-full cursor-pointer transition-colors hover:bg-accent",
													isNewEventTriggerActive &&
														"pointer-events-auto min-h-6",
													!isNewEventTriggerActive && "pointer-events-none",
													className,
												)}
												{...props}
											>
												{isNewEventTriggerActive ? (
													<div className="flex w-full min-w-0 items-center justify-between gap-1.5 truncate text-xs">
														<p className="min-w-0 truncate font-semibold">
															{newEventTitle || "(No title)"}
														</p>
														{!newEventAllDay && newEventStartTime ? (
															<p className="shrink-0">{formattedStartTime}</p>
														) : null}
													</div>
												) : null}
											</button>
										)}
									/>
								</div>

								{groupedEvents.map((group, groupIndex) =>
									group.map((event) => {
										const isPreviewForThis =
											resizePreview?.eventId === event.id;
										const displayEvent: TEvent = (() => {
											if (!isPreviewForThis || !resizePreview) return event;
											if (resizePreview.edge === "bottom") {
												const startTs = parseISO(event.startDate).getTime();
												let endTs =
													resizePreview.slotStartTimestamp + MIN_DURATION_MS;
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
											let startTs = resizePreview.slotStartTimestamp;
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

										if (!hasOverlap)
											style = { ...style, width: "100%", left: "0%" };

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
