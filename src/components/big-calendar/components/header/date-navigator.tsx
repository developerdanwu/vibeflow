import { formatDate } from "date-fns";

import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import type { IEvent } from "@/components/big-calendar/interfaces";
import type { TCalendarView } from "@/components/big-calendar/types";

interface IProps {
	view: TCalendarView;
	events: IEvent[];
}

export function DateNavigator({ view: _view, events: _events }: IProps) {
	const [selectedDate] = useCalendar((s) => s.context.selectedDate);

	const month = formatDate(selectedDate, "MMM");
	const year = selectedDate.getFullYear();

	return (
		<div className="space-y-0.5">
			<div className="flex items-center gap-2">
				<span className="font-semibold text-md">
					{month} {year}
				</span>
			</div>
		</div>
	);
}
