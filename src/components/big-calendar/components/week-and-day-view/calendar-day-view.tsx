import type { TEvent } from "@/components/big-calendar/interfaces";
import { CalendarMultiDayView } from "./calendar-multi-day-view";

interface IProps {
	singleDayEvents: TEvent[];
	multiDayEvents: TEvent[];
}

export function CalendarDayView({ singleDayEvents, multiDayEvents }: IProps) {
	return (
		<CalendarMultiDayView
			dayCount={1}
			singleDayEvents={singleDayEvents}
			multiDayEvents={multiDayEvents}
		/>
	);
}
