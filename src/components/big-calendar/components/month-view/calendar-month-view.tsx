import { EventPopover } from "@/components/big-calendar/components/event-popover";
import { DayCell } from "@/components/big-calendar/components/month-view/day-cell";
import {
	calculateMonthEventPositions,
	getCalendarCells,
} from "@/components/big-calendar/helpers";
import type { IEvent } from "@/components/big-calendar/interfaces";
import { Route } from "@/routes/_authenticated/calendar";
import { Popover as PopoverBase } from "@base-ui/react";
import { useMemo } from "react";

interface IProps {
	singleDayEvents: IEvent[];
	multiDayEvents: IEvent[];
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ singleDayEvents, multiDayEvents }: IProps) {
	const { date: selectedDate } = Route.useSearch();
	const quickAddEventPopoverHandle = useMemo(
		() => PopoverBase.createHandle(),
		[],
	);
	const allEvents = [...multiDayEvents, ...singleDayEvents];

	const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);
	const numRows = useMemo(() => Math.ceil(cells.length / 7), [cells.length]);

	const eventPositions = useMemo(
		() =>
			calculateMonthEventPositions(
				multiDayEvents,
				singleDayEvents,
				selectedDate,
			),
		[multiDayEvents, singleDayEvents, selectedDate],
	);

	return (
		<>
			<div className="flex h-full flex-col">
				<div className="grid grid-cols-7">
					{WEEK_DAYS.map((day) => (
						<div key={day} className="flex items-center justify-center py-2">
							<span className="font-medium text-muted-foreground text-xs">
								{day}
							</span>
						</div>
					))}
				</div>

				<div
					className="grid flex-1 grid-cols-7 overflow-hidden"
					style={{
						gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))`,
					}}
				>
					{cells.map((cell) => (
						<DayCell
							handle={quickAddEventPopoverHandle}
							key={cell.date.toISOString()}
							cell={cell}
							events={allEvents}
							eventPositions={eventPositions}
						/>
					))}
				</div>
			</div>
			<EventPopover handle={quickAddEventPopoverHandle} />
		</>
	);
}
