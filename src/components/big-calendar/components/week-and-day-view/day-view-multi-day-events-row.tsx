import { MonthEventBadge } from "@/components/big-calendar/components/month-view/month-event-badge";
import { isEventOnDate } from "@/components/big-calendar/helpers";
import type { TEvent } from "@/components/big-calendar/interfaces";
import type { PopoverRootProps } from "@base-ui/react";
import { differenceInDays, parseISO, startOfDay } from "date-fns";

interface IProps {
	selectedDate: Date;
	multiDayEvents: TEvent[];
	handle: NonNullable<PopoverRootProps["handle"]>;
}

/** Total displayed days for an event (exclusive end for startDateStr/endDateStr). */
function getEventTotalDays(event: TEvent): number {
	if (event.startDateStr && event.endDateStr) {
		if (event.startDateStr === event.endDateStr) return 1;
		return differenceInDays(
			parseISO(event.endDateStr),
			parseISO(event.startDateStr),
		);
	}
	return (
		differenceInDays(parseISO(event.endDate), parseISO(event.startDate)) + 1
	);
}

/** 1-based day index of date within the event range. */
function getEventCurrentDay(event: TEvent, date: Date): number {
	const day = startOfDay(date);
	if (event.startDateStr && event.endDateStr) {
		return differenceInDays(day, parseISO(event.startDateStr)) + 1;
	}
	return differenceInDays(day, parseISO(event.startDate)) + 1;
}

export function DayViewMultiDayEventsRow({
	selectedDate,
	multiDayEvents,
	handle,
}: IProps) {
	const day = startOfDay(selectedDate);

	const multiDayEventsInDay = multiDayEvents
		.filter((event) => isEventOnDate(event, day))
		.sort((a, b) => getEventTotalDays(b) - getEventTotalDays(a));

	return (
		<div className="flex h-full min-w-0 shrink-0">
			{/* <div className="w-18 shrink-0 border-t"></div> */}
			<div className="flex h-full w-0 flex-1 flex-col justify-start gap-1 overflow-y-auto overflow-x-hidden border-t px-1 py-1 text-left">
				{multiDayEventsInDay.map((event) => (
					<MonthEventBadge
						key={event.id}
						handle={handle}
						event={event}
						cellDate={selectedDate}
						eventCurrentDay={getEventCurrentDay(event, selectedDate)}
						eventTotalDays={getEventTotalDays(event)}
					/>
				))}
			</div>
		</div>
	);
}
