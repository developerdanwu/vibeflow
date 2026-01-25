import { CalendarAgendaView } from "@/components/big-calendar/components/agenda-view/calendar-agenda-view";
import { DndProviderWrapper } from "@/components/big-calendar/components/dnd/dnd-provider";
import { CalendarHeader } from "@/components/big-calendar/components/header/calendar-header";
import { CalendarMonthView } from "@/components/big-calendar/components/month-view/calendar-month-view";
import { CalendarDayView } from "@/components/big-calendar/components/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/components/big-calendar/components/week-and-day-view/calendar-week-view";
import { CalendarYearView } from "@/components/big-calendar/components/year-view/calendar-year-view";
import {
	CalendarProvider,
	useCalendar,
} from "@/components/big-calendar/contexts/calendar-context";
import type { IEvent, IUser } from "@/components/big-calendar/interfaces";
import type { TEventColor } from "@/components/big-calendar/types";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import "@/styles/calendar.css";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@workos/authkit-tanstack-react-start/client";
import { useQuery } from "convex/react";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";

const calendarSearchSchema = z.object({
	view: z.enum(["month", "week", "day", "year", "agenda"]).default("month"),
	date: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/calendar")({
	validateSearch: calendarSearchSchema,
	component: CalendarRoute,
});

function parseUrlDate(dateStr: string | undefined): Date {
	if (!dateStr) return new Date();
	const parsed = new Date(dateStr);
	return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function hashStringToNumber(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

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
		<AuthenticatedLayout>
			<CalendarContent />
		</AuthenticatedLayout>
	);
}

function CalendarContent() {
	const navigate = useNavigate();
	const { view, date: dateParam } = Route.useSearch();
	const { user } = useAuth();

	const currentUser: IUser | null = user
		? {
				id: user.id,
				name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
				picturePath: user.profilePictureUrl ?? null,
			}
		: null;

	const users: IUser[] = currentUser ? [currentUser] : [];

	const convexEvents = useQuery(api.events.getEventsByUser);

	const initialDate = useMemo(() => parseUrlDate(dateParam), [dateParam]);
	const [, store] = useCalendar();

	useEffect(() => {
		store.send({ type: "setSelectedDate", date: initialDate });
	}, [initialDate, store]);

	const events: IEvent[] = useMemo(() => {
		if (!convexEvents || !currentUser) return [];
		return convexEvents.map((event) => ({
			id: hashStringToNumber(event._id),
			convexId: event._id,
			title: event.title,
			description: event.description ?? "",
			startDate: new Date(event.startDate).toISOString(),
			endDate: new Date(event.endDate).toISOString(),
			color: (validColors.includes(event.color as TEventColor)
				? event.color
				: "blue") as TEventColor,
			user: currentUser,
		}));
	}, [convexEvents, currentUser]);

	const singleDayEvents = useMemo(() => {
		return events.filter((event) => {
			const start = new Date(event.startDate);
			const end = new Date(event.endDate);
			const duration = end.getTime() - start.getTime();
			return duration < 24 * 60 * 60 * 1000;
		});
	}, [events]);

	const multiDayEvents = useMemo(() => {
		return events.filter((event) => {
			const start = new Date(event.startDate);
			const end = new Date(event.endDate);
			const duration = end.getTime() - start.getTime();
			return duration >= 24 * 60 * 60 * 1000;
		});
	}, [events]);

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
				return <CalendarYearView allEvents={events} />;
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

	const isLoading = convexEvents === undefined;

	return (
		<div className="h-[calc(100vh-52px)] bg-background calendar-container">
			<CalendarProvider users={users} events={events}>
				<DndProviderWrapper>
					<div className="h-full">
						<CalendarHeader view={view} events={events} />
						<div className="h-full flex flex-col">
							{isLoading ? (
								<div className="flex items-center justify-center h-full">
									<div className="flex flex-col items-center gap-4">
										<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
										<p className="text-muted-foreground">Loading events...</p>
									</div>
								</div>
							) : (
								renderCalendarView()
							)}
						</div>
					</div>
				</DndProviderWrapper>
			</CalendarProvider>
		</div>
	);
}
