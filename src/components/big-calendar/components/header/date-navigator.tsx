import {
	addDays,
	endOfMonth,
	format,
	startOfMonth,
} from "date-fns";

import type { TEvent } from "@/components/big-calendar/interfaces";
import type { TCalendarView } from "@/components/big-calendar/types";
import { Route } from "@/routes/_authenticated/calendar";

interface IProps {
	view: TCalendarView;
	events: TEvent[];
}

export function DateNavigator({ view, events: _events }: IProps) {
	const { date: selectedDate, agendaRange } = Route.useSearch();

	const label = (() => {
		if (view === "day") {
			return format(selectedDate, "MMM d, yyyy");
		}
		if (
			view === "agenda" &&
			agendaRange !== "month" &&
			(agendaRange === "3" || agendaRange === "7" || agendaRange === "14")
		) {
			const n = Number.parseInt(agendaRange, 10);
			const end = addDays(selectedDate, n - 1);
			return `${format(selectedDate, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
		}
		// Month view or agenda with "month" range
		const start = startOfMonth(selectedDate);
		const end = endOfMonth(selectedDate);
		return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
	})();

	return (
		<div className="space-y-0.5">
			<div className="flex items-center gap-2">
				<span className="font-semibold text-md">{label}</span>
			</div>
		</div>
	);
}
