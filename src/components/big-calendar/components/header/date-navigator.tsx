import { formatDate } from "date-fns";

import type { TEvent } from "@/components/big-calendar/interfaces";
import type { TCalendarView } from "@/components/big-calendar/types";
import { Route } from "@/routes/_authenticated/calendar";

interface IProps {
	view: TCalendarView;
	events: TEvent[];
}

export function DateNavigator({ view: _view, events: _events }: IProps) {
	const { date: selectedDate } = Route.useSearch();

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
