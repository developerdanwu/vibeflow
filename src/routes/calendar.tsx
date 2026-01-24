import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { CalendarAgendaView } from "@/components/big-calendar/components/agenda-view/calendar-agenda-view";
import { DndProviderWrapper } from "@/components/big-calendar/components/dnd/dnd-provider";
import { CalendarHeader } from "@/components/big-calendar/components/header/calendar-header";
import { CalendarMonthView } from "@/components/big-calendar/components/month-view/calendar-month-view";
import { CalendarDayView } from "@/components/big-calendar/components/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/components/big-calendar/components/week-and-day-view/calendar-week-view";
import { CalendarYearView } from "@/components/big-calendar/components/year-view/calendar-year-view";
import { CalendarProvider } from "@/components/big-calendar/contexts/calendar-context";
import type { IEvent, IUser } from "@/components/big-calendar/interfaces";
import "@/styles/calendar.css";

const calendarSearchSchema = z.object({
	view: z.enum(["month", "week", "day", "year", "agenda"]).default("month"),
	date: z.string().optional(),
});

export const Route = createFileRoute("/calendar")({
	validateSearch: calendarSearchSchema,
	component: CalendarRoute,
});

const sampleUsers: IUser[] = [
	{
		id: "user-1",
		name: "John Doe",
		picturePath: "https://i.pravatar.cc/300?img=1",
	},
	{
		id: "user-2",
		name: "Jane Smith",
		picturePath: "https://i.pravatar.cc/300?img=2",
	},
];

const sampleEvents: IEvent[] = [
	{
		id: 1,
		title: "Team Meeting",
		description: "Weekly team sync",
		startDate: new Date(2026, 0, 27, 10, 0).toISOString(),
		endDate: new Date(2026, 0, 27, 11, 0).toISOString(),
		user: sampleUsers[0],
		color: "blue",
	},
	{
		id: 2,
		title: "Project Review",
		description: "Q1 project review",
		startDate: new Date(2026, 0, 28, 14, 0).toISOString(),
		endDate: new Date(2026, 0, 28, 15, 30).toISOString(),
		user: sampleUsers[1],
		color: "red",
	},
	{
		id: 3,
		title: "All Day Event",
		description: "Company Holiday",
		startDate: new Date(2026, 0, 30, 0, 0).toISOString(),
		endDate: new Date(2026, 0, 30, 23, 59).toISOString(),
		user: sampleUsers[0],
		color: "green",
	},
];

function CalendarRoute() {
	const navigate = useNavigate();
	const { view } = Route.useSearch();

	const singleDayEvents = sampleEvents.filter((event) => {
		const start = new Date(event.startDate);
		const end = new Date(event.endDate);
		const duration = end.getTime() - start.getTime();
		return duration < 24 * 60 * 60 * 1000;
	});

	const multiDayEvents = sampleEvents.filter((event) => {
		const start = new Date(event.startDate);
		const end = new Date(event.endDate);
		const duration = end.getTime() - start.getTime();
		return duration >= 24 * 60 * 60 * 1000;
	});

	const handleViewChange = (
		newView: "month" | "week" | "day" | "year" | "agenda",
	) => {
		navigate({
			to: "/calendar",
			search: { view: newView },
			replace: true,
		});
	};

	const renderCalendarView = () => {
		switch (view) {
			case "day":
				return (
					<CalendarDayView
						singleDayEvents={singleDayEvents}
						multiDayEvents={multiDayEvents}
					/>
				);
			case "week":
				return (
					<CalendarWeekView
						singleDayEvents={singleDayEvents}
						multiDayEvents={multiDayEvents}
					/>
				);
			case "year":
				return <CalendarYearView allEvents={sampleEvents} />;
			case "agenda":
				return (
					<CalendarAgendaView
						singleDayEvents={singleDayEvents}
						multiDayEvents={multiDayEvents}
					/>
				);
			case "month":
			default:
				return (
					<CalendarMonthView
						singleDayEvents={singleDayEvents}
						multiDayEvents={multiDayEvents}
					/>
				);
		}
	};

	return (
		<div className="min-h-screen bg-background calendar-container">
			<CalendarProvider users={sampleUsers} events={sampleEvents}>
				<DndProviderWrapper>
					<div className="container mx-auto p-6">
						<div className="flex items-center justify-between mb-6">
							<h1 className="text-3xl font-bold">Calendar</h1>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => handleViewChange("day")}
									className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
										view === "day"
											? "bg-primary text-primary-foreground"
											: "bg-secondary/20 hover:bg-secondary/30"
									}`}
								>
									Day
								</button>
								<button
									type="button"
									onClick={() => handleViewChange("week")}
									className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
										view === "week"
											? "bg-primary text-primary-foreground"
											: "bg-secondary/20 hover:bg-secondary/30"
									}`}
								>
									Week
								</button>
								<button
									type="button"
									onClick={() => handleViewChange("month")}
									className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
										view === "month"
											? "bg-primary text-primary-foreground"
											: "bg-secondary/20 hover:bg-secondary/30"
									}`}
								>
									Month
								</button>
								<button
									type="button"
									onClick={() => handleViewChange("year")}
									className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
										view === "year"
											? "bg-primary text-primary-foreground"
											: "bg-secondary/20 hover:bg-secondary/30"
									}`}
								>
									Year
								</button>
								<button
									type="button"
									onClick={() => handleViewChange("agenda")}
									className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
										view === "agenda"
											? "bg-primary text-primary-foreground"
											: "bg-secondary/20 hover:bg-secondary/30"
									}`}
								>
									Agenda
								</button>
							</div>
						</div>
						<CalendarHeader view={view} events={sampleEvents} />
						<div className="mt-6 border rounded-lg p-4 bg-card">
							{renderCalendarView()}
						</div>
					</div>
				</DndProviderWrapper>
			</CalendarProvider>
		</div>
	);
}
