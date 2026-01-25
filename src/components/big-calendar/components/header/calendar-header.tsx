import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateNavigator } from "@/components/big-calendar/components/header/date-navigator";
import type { IEvent } from "@/components/big-calendar/interfaces";
import type { TCalendarView } from "@/components/big-calendar/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendar } from "../../contexts/calendar-context";
import { navigateDate } from "../../helpers";

interface IProps {
	view: TCalendarView;
	events: IEvent[];
	onViewChange?: (view: TCalendarView) => void;
}

export function CalendarHeader({ view, events }: IProps) {
	const navigate = useNavigate();
	const [selectedDate, store] = useCalendar((s) => s.context.selectedDate);

	const handlePrevious = () =>
		store.send({
			type: "setSelectedDate",
			date: navigateDate(selectedDate, view, "previous"),
		});
	const handleNext = () =>
		store.send({
			type: "setSelectedDate",
			date: navigateDate(selectedDate, view, "next"),
		});
	const handleToday = () =>
		store.send({ type: "setSelectedDate", date: new Date() });

	const handleViewChange = (newView: TCalendarView) => {
		navigate({
			to: "/calendar",
			search: (prev) => ({ ...prev, view: newView }),
		});
	};

	// Map view to tab value - use "day" for day view, "month" for month view
	const currentTab = view === "day" ? "day" : "month";

	return (
		<div className="flex flex-col gap-4 pt-2 pb-3 px-3 flex-row items-center justify-between">
			<DateNavigator view={view} events={events} />
			<div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon-sm" onClick={handleToday}>
						T
					</Button>
					<Button variant="ghost" size="icon-sm" onClick={handlePrevious}>
						<ChevronLeft />
					</Button>
					<Button variant="ghost" size="icon-sm" onClick={handleNext}>
						<ChevronRight />
					</Button>
					<Tabs
						value={currentTab}
						onValueChange={(value) => {
							handleViewChange(value as TCalendarView);
						}}
					>
						<TabsList>
							<TabsTrigger value="day">Day</TabsTrigger>
							<TabsTrigger value="month">Month</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
