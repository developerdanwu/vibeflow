import { useCalendarSearch } from "@/routes/_authenticated/calendar/index";
import { dayRangeToDayCount } from "@/routes/_authenticated/calendar/-components/calendar/core/helpers";
import type { TEvent } from "@/routes/_authenticated/calendar/-components/calendar/core/interfaces";
import type { TDayRange } from "@/routes/_authenticated/calendar/-components/calendar/core/types";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";

interface IProps {
	dayRange: TDayRange;
	events: TEvent[];
}

export function DateNavigator({ dayRange, events: _events }: IProps) {
	const { date: selectedDate } = useCalendarSearch();

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
