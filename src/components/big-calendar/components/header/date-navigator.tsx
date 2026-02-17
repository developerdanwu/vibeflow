import { addDays, endOfMonth, format, startOfMonth } from "date-fns";

import { dayRangeToDayCount } from "@/components/big-calendar/helpers";
import type { TEvent } from "@/components/big-calendar/interfaces";
import type { TDayRange } from "@/components/big-calendar/types";
import { Route } from "@/routes/_authenticated/calendar";

interface IProps {
	dayRange: TDayRange;
	events: TEvent[];
}

export function DateNavigator({ dayRange, events: _events }: IProps) {
	const { date: selectedDate } = Route.useSearch();

	const dayCount = dayRangeToDayCount(dayRange);
	const label =
		dayCount !== null
			? dayCount === 1
				? format(selectedDate, "MMM d, yyyy")
				: `${format(selectedDate, "MMM d")} – ${format(addDays(selectedDate, dayCount - 1), "MMM d, yyyy")}`
			: `${format(startOfMonth(selectedDate), "MMM d")} – ${format(endOfMonth(selectedDate), "MMM d, yyyy")}`;

	return (
		<div className="space-y-0.5">
			<div className="flex items-center gap-2">
				<span className="font-semibold text-md">{label}</span>
			</div>
		</div>
	);
}
