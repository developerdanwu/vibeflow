import { CalendarViewPopover } from "@/components/big-calendar/components/header/calendar-view-popover";
import { DateNavigator } from "@/components/big-calendar/components/header/date-navigator";
import type { TEvent } from "@/components/big-calendar/interfaces";
import type { TCalendarView } from "@/components/big-calendar/types";
import { Button } from "@/components/ui/button";
import { Route } from "@/routes/_authenticated/calendar";
import { Link, useNavigate } from "@tanstack/react-router";
import { addDays, addMonths, subDays, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface IProps {
	view: TCalendarView;
	events: TEvent[];
	onViewChange?: (view: TCalendarView) => void;
}

export function CalendarHeader({ view, events }: IProps) {
	const navigate = useNavigate();
	const { agendaRange } = Route.useSearch();

	const handleToday = () =>
		navigate({
			to: "/calendar",
			search: (prev) => ({ ...prev, date: new Date() }),
		});

	const agendaStepDays =
		view === "agenda" && agendaRange !== "month"
			? Number.parseInt(agendaRange, 10)
			: null;

	return (
		<div className="flex w-full items-center justify-between gap-2 px-3 pt-2 pb-3">
			<DateNavigator view={view} events={events} />
			<div className="flex flex-wrap items-center gap-1">
				<Button variant="ghost" size="icon-sm" onClick={handleToday}>
					T
				</Button>
				<Link
					from="/calendar/"
					search={(prev) => {
						if (prev.view === "day") {
							return { ...prev, date: subDays(prev.date, 1) };
						}
						if (agendaStepDays !== null) {
							return {
								...prev,
								date: subDays(prev.date, agendaStepDays),
							};
						}
						return { ...prev, date: subMonths(prev.date, 1) };
					}}
				>
					<Button variant="ghost" size="icon-sm">
						<ChevronLeft />
					</Button>
				</Link>
				<Link
					from="/calendar/"
					search={(prev) => {
						if (prev.view === "day") {
							return { ...prev, date: addDays(prev.date, 1) };
						}
						if (agendaStepDays !== null) {
							return {
								...prev,
								date: addDays(prev.date, agendaStepDays),
							};
						}
						return { ...prev, date: addMonths(prev.date, 1) };
					}}
				>
				<Button variant="ghost" size="icon-sm">
					<ChevronRight />
				</Button>
			</Link>
				<CalendarViewPopover />
			</div>
		</div>
	);
}
