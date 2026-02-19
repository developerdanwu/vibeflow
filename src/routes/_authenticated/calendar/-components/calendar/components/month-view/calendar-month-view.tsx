import { useCalendarSearch } from "@/routes/_authenticated/calendar/index";
import { EventPopover } from "@/routes/_authenticated/calendar/-components/event-popover/event-popover";
import { DayCell } from "@/routes/_authenticated/calendar/-components/calendar/components/month-view/day-cell";
import {
	calculateMonthEventPositions,
	getCalendarCells,
} from "@/routes/_authenticated/calendar/-components/calendar/core/helpers";
import type { TEvent } from "@/routes/_authenticated/calendar/-components/calendar/core/interfaces";
import { Popover as PopoverBase } from "@base-ui/react";
import { useMemo } from "react";

interface IProps {
	singleDayEvents: TEvent[];
	multiDayEvents: TEvent[];
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ singleDayEvents, multiDayEvents }: IProps) {
	const { date: selectedDate } = useCalendarSearch();
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
					className="grid flex-1 grid-cols-7 overflow-visible"
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
