import { DroppableTimeBlock } from "@/components/big-calendar/components/dnd/droppable-time-block";
import { EventPopover } from "@/components/big-calendar/components/event-popover";
import { eventBadgeVariants } from "@/components/big-calendar/components/month-view/month-event-badge";
import { CalendarTimeline } from "@/components/big-calendar/components/week-and-day-view/calendar-time-line";
import { DayViewMultiDayEventsRow } from "@/components/big-calendar/components/week-and-day-view/day-view-multi-day-events-row";
import { EventBlock } from "@/components/big-calendar/components/week-and-day-view/event-block";
import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import {
	getEventBlockStyle,
	getVisibleHours,
	groupEvents,
	isWorkingHour,
} from "@/components/big-calendar/helpers";
import type { IEvent } from "@/components/big-calendar/interfaces";
import { PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Route } from "@/routes/_authenticated/calendar";
import { Popover as PopoverBase } from "@base-ui/react";
import type { VariantProps } from "class-variance-authority";
import { areIntervalsOverlapping, format, parseISO } from "date-fns";
import { useMemo } from "react";

interface IProps {
	singleDayEvents: IEvent[];
	multiDayEvents: IEvent[];
}

export function CalendarDayView({ singleDayEvents, multiDayEvents }: IProps) {
	const quickAddEventPopoverHandle = useMemo(
		() => PopoverBase.createHandle(),
		[],
	);
	const { date: selectedDate } = Route.useSearch();
	const [workingHours] = useCalendar((s) => s.context.workingHours);
	const [badgeVariant] = useCalendar((s) => s.context.badgeVariant);
	const [newEventTitle] = useCalendar((s) => s.context.newEventTitle);
	const [newEventStartTime] = useCalendar((s) => s.context.newEventStartTime);
	const [newEventAllDay] = useCalendar((s) => s.context.newEventAllDay);

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
							<span className="font-semibold text-foreground">
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
												<PopoverTrigger
													handle={quickAddEventPopoverHandle}
													id={`day-slot-${hour}-0`}
													payload={{
														date: selectedDate,
														time: { hour, minute: 0 },
													}}
													nativeButton={false}
													render={({ className, onClick, ...props }) => {
														const triggerId = `day-slot-${hour}-0`;
														const isActive =
															isOpen && activeTriggerId === triggerId;
														return (
															<button
																type="button"
																className={cn(
																	isActive &&
																		eventBadgeVariants({
																			color: addEventColor,
																		}),
																	"absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent",
																	isActive && "min-h-6",
																	className,
																)}
																onClick={(e) => {
																	e.stopPropagation();
																	onClick?.(e);
																}}
																{...props}
															>
																{isActive ? (
																	<div className="flex w-full min-w-0 items-center justify-between gap-1.5 truncate text-xs">
																		<p className="min-w-0 truncate font-semibold">
																			{newEventTitle || "(No title)"}
																		</p>
																		{!newEventAllDay && newEventStartTime ? (
																			<p className="shrink-0">
																				{formattedStartTime}
																			</p>
																		) : null}
																	</div>
																) : null}
															</button>
														);
													}}
												/>
											</DroppableTimeBlock>

											<DroppableTimeBlock
												date={selectedDate}
												hour={hour}
												minute={15}
											>
												<PopoverTrigger
													handle={quickAddEventPopoverHandle}
													id={`day-slot-${hour}-15`}
													payload={{
														date: selectedDate,
														time: { hour, minute: 15 },
													}}
													nativeButton={false}
													render={({ className, onClick, ...props }) => {
														const triggerId = `day-slot-${hour}-15`;
														const isActive =
															isOpen && activeTriggerId === triggerId;
														return (
															<button
																type="button"
																className={cn(
																	isActive &&
																		eventBadgeVariants({
																			color: addEventColor,
																		}),
																	"absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-accent",
																	isActive && "min-h-6",
																	className,
																)}
																onClick={(e) => {
																	e.stopPropagation();
																	onClick?.(e);
																}}
																{...props}
															>
																{isActive ? (
																	<div className="flex w-full min-w-0 items-center justify-between gap-1.5 truncate text-xs">
																		<p className="min-w-0 truncate font-semibold">
																			{newEventTitle || "(No title)"}
																		</p>
																		{!newEventAllDay && newEventStartTime ? (
																			<p className="shrink-0">
																				{formattedStartTime}
																			</p>
																		) : null}
																	</div>
																) : null}
															</button>
														);
													}}
												/>
											</DroppableTimeBlock>

											<div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed"></div>

											<DroppableTimeBlock
												date={selectedDate}
												hour={hour}
												minute={30}
											>
												<PopoverTrigger
													handle={quickAddEventPopoverHandle}
													id={`day-slot-${hour}-30`}
													payload={{
														date: selectedDate,
														time: { hour, minute: 30 },
													}}
													nativeButton={false}
													render={({ className, onClick, ...props }) => {
														const triggerId = `day-slot-${hour}-30`;
														const isActive =
															isOpen && activeTriggerId === triggerId;
														return (
															<button
																type="button"
																className={cn(
																	isActive &&
																		eventBadgeVariants({
																			color: addEventColor,
																		}),
																	"absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent",
																	isActive && "min-h-6",
																	className,
																)}
																onClick={(e) => {
																	e.stopPropagation();
																	onClick?.(e);
																}}
																{...props}
															>
																{isActive ? (
																	<div className="flex w-full min-w-0 items-center justify-between gap-1.5 truncate text-xs">
																		<p className="min-w-0 truncate font-semibold">
																			{newEventTitle || "(No title)"}
																		</p>
																		{!newEventAllDay && newEventStartTime ? (
																			<p className="shrink-0">
																				{formattedStartTime}
																			</p>
																		) : null}
																	</div>
																) : null}
															</button>
														);
													}}
												/>
											</DroppableTimeBlock>

											<DroppableTimeBlock
												date={selectedDate}
												hour={hour}
												minute={45}
											>
												<PopoverTrigger
													handle={quickAddEventPopoverHandle}
													id={`day-slot-${hour}-45`}
													payload={{
														date: selectedDate,
														time: { hour, minute: 45 },
													}}
													nativeButton={false}
													render={({ className, onClick, ...props }) => {
														const triggerId = `day-slot-${hour}-45`;
														const isActive =
															isOpen && activeTriggerId === triggerId;
														return (
															<button
																type="button"
																className={cn(
																	isActive &&
																		eventBadgeVariants({
																			color: addEventColor,
																		}),
																	"absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent",
																	isActive && "min-h-6",
																	className,
																)}
																onClick={(e) => {
																	e.stopPropagation();
																	onClick?.(e);
																}}
																{...props}
															>
																{isActive ? (
																	<div className="flex w-full min-w-0 items-center justify-between gap-1.5 truncate text-xs">
																		<p className="min-w-0 truncate font-semibold">
																			{newEventTitle || "(No title)"}
																		</p>
																		{!newEventAllDay && newEventStartTime ? (
																			<p className="shrink-0">
																				{formattedStartTime}
																			</p>
																		) : null}
																	</div>
																) : null}
															</button>
														);
													}}
												/>
											</DroppableTimeBlock>
										</div>
									);
								})}

								{groupedEvents.map((group, groupIndex) =>
									group.map((event) => {
										let style = getEventBlockStyle(
											event,
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

										return (
											<div
												key={event.id}
												className="absolute p-1"
												style={style}
											>
												<EventBlock
													event={event}
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
