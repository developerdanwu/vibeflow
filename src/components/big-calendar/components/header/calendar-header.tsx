import { DateNavigator } from "@/components/big-calendar/components/header/date-navigator";
import type { TEvent } from "@/components/big-calendar/interfaces";
import type { TCalendarView } from "@/components/big-calendar/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

	const handleToday = () =>
		navigate({
			to: "/calendar",
			search: (prev) => ({ ...prev, date: new Date() }),
		});

	const handleViewChange = (newView: TCalendarView) => {
		navigate({
			to: "/calendar",
			search: (prev) => ({ ...prev, view: newView }),
		});
	};

	// Map view to tab value - day, agenda, or month
	const currentTab =
		view === "day" ? "day" : view === "agenda" ? "agenda" : "month";

	return (
		<div className="flex flex-row flex-col items-center justify-between gap-4 px-3 pt-2 pb-3">
			<DateNavigator view={view} events={events} />
			<div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon-sm" onClick={handleToday}>
						T
					</Button>
					<Link
						from="/calendar/"
						search={({ date, view }) => {
							if (view === "day") {
								return { date: subDays(date, 1), view };
							}
							return { date: subMonths(date, 1), view };
						}}
					>
						<Button variant="ghost" size="icon-sm">
							<ChevronLeft />
						</Button>
					</Link>

					<Link
						from="/calendar/"
						search={({ date, view }) => {
							if (view === "day") {
								return { date: addDays(date, 1), view };
							}
							return { date: addMonths(date, 1), view };
						}}
					>
						<Button variant="ghost" size="icon-sm">
							<ChevronRight />
						</Button>
					</Link>
					<Tabs
						value={currentTab}
						onValueChange={(value) => {
							handleViewChange(value as TCalendarView);
						}}
					>
						<TabsList>
							<TabsTrigger value="day">Day</TabsTrigger>
							<TabsTrigger value="month">Month</TabsTrigger>
							<TabsTrigger value="agenda">Agenda</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
