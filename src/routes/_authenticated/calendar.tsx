import {
	DayWeekDndProvider,
	MonthDndProvider,
} from "@/components/big-calendar/components/dnd/dnd-provider";
import { CalendarHeader } from "@/components/big-calendar/components/header/calendar-header";
import { CalendarMonthView } from "@/components/big-calendar/components/month-view/calendar-month-view";
import { CalendarDayView } from "@/components/big-calendar/components/week-and-day-view/calendar-day-view";
import { CalendarProvider } from "@/components/big-calendar/contexts/calendar-context";
import type { TEvent, TUser } from "@/components/big-calendar/interfaces";
import type { TEventColor } from "@/components/big-calendar/types";
import "@/styles/calendar.css";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@workos/authkit-tanstack-react-start/client";
import { useMemo } from "react";
import { z } from "zod";

const calendarSearchSchema = z.object({
	view: z.enum(["month", "week", "day", "year", "agenda"]).default("month"),
	date: z.coerce.date().default(new Date()),
});

export const Route = createFileRoute("/_authenticated/calendar")({
	validateSearch: calendarSearchSchema,
	component: CalendarRoute,
});

const validColors: TEventColor[] = [
	"blue",
	"red",
	"green",
	"yellow",
	"purple",
	"orange",
	"gray",
];

function CalendarRoute() {
	return (
		<CalendarProvider>
			<CalendarContent />
		</CalendarProvider>
	);
}

function CalendarContent() {
	const { view } = Route.useSearch();
	const { user } = useAuth();

	const currentUser: TUser | null = user
		? {
				id: user.id,
				name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
				picturePath: user.profilePictureUrl ?? null,
			}
		: null;

	const { data: convexEvents } = useQuery(
		convexQuery(api.events.getEventsByUser),
	);

	const events: TEvent[] = useMemo(() => {
		if (!convexEvents || !currentUser) return [];
		return convexEvents.map((event) => ({
			id: event._id,
			convexId: event._id,
			title: event.title,
			description: event.description ?? "",
			startDate: new Date(event.startTimestamp).toISOString(),
			endDate: new Date(event.endTimestamp).toISOString(),
			color: (validColors.includes(event.color as TEventColor)
				? event.color
				: "blue") as TEventColor,
			user: currentUser,
			allDay: event.allDay,
			startDateStr: event.startDateStr,
			endDateStr: event.endDateStr,
			startTime: event.startTime,
			endTime: event.endTime,
			timeZone: event.timeZone,
			createdAt: event._creationTime,
			recurringEventId: event.recurringEventId,
			isEditable: event.isEditable,
			calendarId: event.calendarId,
		}));
	}, [convexEvents, currentUser]);

	const singleDayEvents = useMemo(() => {
		return events.filter((event) => {
			if (event.allDay) return false;
			const start = new Date(event.startDate);
			const end = new Date(event.endDate);
			const duration = end.getTime() - start.getTime();
			return duration < 24 * 60 * 60 * 1000;
		});
	}, [events]);

	const multiDayEvents = useMemo(() => {
		return events.filter((event) => {
			if (event.allDay) {
				return true;
			}
			const start = new Date(event.startDate);
			const end = new Date(event.endDate);
			const duration = end.getTime() - start.getTime();
			return duration >= 24 * 60 * 60 * 1000;
		});
	}, [events]);

	const isLoading = convexEvents === undefined;

	return (
		<div className="calendar-container h-[calc(100vh-52px)] bg-background">
			<div className="h-full">
				<CalendarHeader view={view} events={events} />
				<div className="flex h-full flex-col">
					{isLoading ? (
						<div className="flex h-full items-center justify-center">
							<div className="flex flex-col items-center gap-4">
								<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
								<p className="text-muted-foreground">Loading events...</p>
							</div>
						</div>
					) : (
						<>
							{view === "day" ? (
								<DayWeekDndProvider view="day">
									<CalendarDayView
										singleDayEvents={singleDayEvents}
										multiDayEvents={multiDayEvents}
									/>
								</DayWeekDndProvider>
							) : null}
							{view === "month" ? (
								<MonthDndProvider>
									<CalendarMonthView
										singleDayEvents={singleDayEvents}
										multiDayEvents={multiDayEvents}
									/>
								</MonthDndProvider>
							) : null}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
