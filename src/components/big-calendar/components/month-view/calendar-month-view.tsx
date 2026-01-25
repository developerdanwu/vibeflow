import { useMemo } from "react";
import { DayCell } from "@/components/big-calendar/components/month-view/day-cell";
import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";

import {
	calculateMonthEventPositions,
	getCalendarCells,
} from "@/components/big-calendar/helpers";

import type { IEvent } from "@/components/big-calendar/interfaces";

interface IProps {
	singleDayEvents: IEvent[];
	multiDayEvents: IEvent[];
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ singleDayEvents, multiDayEvents }: IProps) {
	const [selectedDate] = useCalendar((s) => s.context.selectedDate);

	const allEvents = [...multiDayEvents, ...singleDayEvents];

	const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

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
		<div className="h-full flex flex-col">
			<div className="grid grid-cols-7">
				{WEEK_DAYS.map((day) => (
					<div key={day} className="flex items-center justify-center py-2">
						<span className="text-xs font-medium text-muted-foreground">
							{day}
						</span>
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 overflow-hidden flex-1">
				{cells.map((cell) => (
					<DayCell
						key={cell.date.toISOString()}
						cell={cell}
						events={allEvents}
						eventPositions={eventPositions}
					/>
				))}
			</div>
		</div>
	);
}
