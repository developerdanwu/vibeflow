import { DroppableDayCell } from "@/components/big-calendar/components/dnd/droppable-day-cell";
import { EventPopover } from "@/components/big-calendar/components/event-popover";
import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import {
	getVisibleHours,
	groupEvents,
} from "@/components/big-calendar/helpers";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Route } from "@/routes/_authenticated/calendar";
import { Popover as PopoverBase } from "@base-ui/react";
import { addDays, format, isToday, parseISO, startOfDay } from "date-fns";
import { useMemo } from "react";
import { DayViewColumn } from "./day-view-column";
import { DayViewMultiDayEventsRow } from "./day-view-multi-day-events-row";

interface IProps {
	dayCount: 1 | 2 | 3 | 4 | 5 | 6 | 7;
	singleDayEvents: TEvent[];
	multiDayEvents: TEvent[];
}

function newEventTriggerId(index: number): string {
	return `new-event-trigger-${index}`;
}

export function CalendarMultiDayView({
	dayCount,
	singleDayEvents,
	multiDayEvents,
}: IProps) {
	const quickAddEventPopoverHandle = useMemo(
		() => PopoverBase.createHandle(),
		[],
	);
	const quickEventPopoverHandle = useMemo(() => PopoverBase.createHandle(), []);
	const { date: selectedDate } = Route.useSearch();
	const [workingHours] = useCalendar((s) => s.context.workingHours);

	const days = useMemo(
		() =>
			[...Array(dayCount)].map((_, i) => startOfDay(addDays(selectedDate, i))),
		[selectedDate, dayCount],
	);

	const { hours, earliestEventHour, latestEventHour } = getVisibleHours(
		{ from: 0, to: 24 },
		singleDayEvents,
	);

	const eventsPerDay = useMemo(
		() =>
			days.map((day) =>
				singleDayEvents.filter((event) => {
					const eventDate = parseISO(event.startDate);
					return (
						eventDate.getDate() === day.getDate() &&
						eventDate.getMonth() === day.getMonth() &&
						eventDate.getFullYear() === day.getFullYear()
					);
				}),
			),
		[singleDayEvents, days],
	);

	const groupedPerDay = useMemo(
		() => eventsPerDay.map((dayEvents) => groupEvents(dayEvents)),
		[eventsPerDay],
	);

	const renderHeader = () => {
		return (
			<div className="relative z-20 flex h-full border-b">
				<div className="w-18 shrink-0" />
				{days.map((day) => (
					<DroppableDayCell
						key={format(day, "yyyy-MM-dd")}
						cell={{
							day: day.getDate(),
							currentMonth: true,
							date: day,
						}}
						className="relative flex h-full flex-1 flex-col border-l"
					>
						<span className="flex items-center justify-center border-b py-1 font-medium text-muted-foreground text-xs">
							{format(day, "EE")}{" "}
							<span
								className={cn(
									"inline-flex size-6 items-center justify-center rounded-full font-semibold text-foreground",
									isToday(day) &&
										"bg-primary font-bold text-primary-foreground",
								)}
							>
								{format(day, "d")}
							</span>
						</span>
						<DayViewMultiDayEventsRow
							selectedDate={day}
							multiDayEvents={multiDayEvents}
							handle={quickEventPopoverHandle}
						/>
					</DroppableDayCell>
				))}
			</div>
		);
	};

	return (
		<>
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="shrink">{renderHeader()}</div>
				<ScrollArea className="h-0 flex-[1_1_0px]">
					<div className="flex">
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
						{days.map((day, i) => (
							<DayViewColumn
								key={format(day, "yyyy-MM-dd")}
								day={day}
								triggerId={newEventTriggerId(i)}
								quickAddEventPopoverHandle={quickAddEventPopoverHandle}
								hours={hours}
								workingHours={workingHours}
								earliestEventHour={earliestEventHour}
								latestEventHour={latestEventHour}
								groupedEvents={groupedPerDay[i] ?? []}
							/>
						))}
					</div>
				</ScrollArea>
			</div>
			<EventPopover handle={quickAddEventPopoverHandle} />
		</>
	);
}
