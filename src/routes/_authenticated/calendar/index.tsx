import { CalendarAgendaView } from "@/components/big-calendar/components/agenda-view/calendar-agenda-view";
import {
	DayWeekDndProvider,
	MonthDndProvider,
} from "@/components/big-calendar/components/dnd/dnd-provider";
import { CalendarHeader } from "@/components/big-calendar/components/header/calendar-header";
import { CalendarMonthView } from "@/components/big-calendar/components/month-view/calendar-month-view";
import { TaskSidebar } from "@/components/big-calendar/components/task-sidebar/task-sidebar";
import { CalendarMultiDayView } from "@/components/big-calendar/components/week-and-day-view/calendar-multi-day-view";
import { dayRangeToDayCount } from "@/components/big-calendar/helpers";
import { CalendarProvider } from "@/components/big-calendar/contexts/calendar-context";
import {
	type TEvent,
	type TUser,
	ZEventSchema,
} from "@/components/big-calendar/interfaces";
import type { TEventColor } from "@/components/big-calendar/types";
import "@/styles/calendar.css";
import { api } from "@convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@workos/authkit-tanstack-react-start/client";
import { useMemo, useState } from "react";
import { z } from "zod";

const dayRangeEnum = z.enum(["1", "2", "3", "4", "5", "6", "W", "M"]);

const calendarSearchSchema = z.object({
	view: z.enum(["calendar", "agenda"]).default("calendar"),
	date: z.coerce.date().default(new Date()),
	dayRange: dayRangeEnum.default("M"),
});

export const Route = createFileRoute("/_authenticated/calendar/")({
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
	const { view, dayRange } = Route.useSearch();
	const { user } = useAuth();

	const currentUser: TUser | null = user
		? {
				id: user.id,
				name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
				picturePath: user.profilePictureUrl ?? null,
			}
		: null;

	const { data: convexEvents } = useQuery(
		convexQuery(api.events.queries.getEventsByUser),
	);

	const events: TEvent[] = useMemo(() => {
		if (!convexEvents || !currentUser) {
			return [];
		}
		return convexEvents.map((event) => {
			const mappedEvent = {
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
				busy: event.busy,
				visibility: event.visibility,
				eventKind: event.eventKind ?? "event",
			};

			return ZEventSchema.parse(mappedEvent);
		});
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
	const [taskSidebarOpen, _setTaskSidebarOpen] = useState(true);

	return (
		<div className="calendar-container flex h-[calc(100vh-52px)] flex-col bg-background">
			<div className="flex h-full min-w-0">
				<div className="flex min-h-0 flex-1 flex-col">
					<div className="flex items-center gap-1">
						<CalendarHeader dayRange={dayRange} events={events} />
						{/* <Button
							variant="ghost"
							size="icon-sm"
							onClick={() => setTaskSidebarOpen((o) => !o)}
							title={taskSidebarOpen ? "Hide tasks" : "Show tasks"}
						>
							{taskSidebarOpen ? (
								<PanelRightClose className="size-4" />
							) : (
								<PanelRightOpen className="size-4" />
							)}
						</Button> */}
					</div>
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
								{view === "calendar" && dayRange === "M" ? (
									<MonthDndProvider>
										<CalendarMonthView
											singleDayEvents={singleDayEvents}
											multiDayEvents={multiDayEvents}
										/>
									</MonthDndProvider>
								) : null}
								{view === "calendar" && dayRange !== "M" ? (
									<DayWeekDndProvider
										view={
											dayRangeToDayCount(dayRange) === 1 ? "day" : "2day"
										}
									>
										<CalendarMultiDayView
											dayCount={
												dayRangeToDayCount(dayRange) as 1 | 2 | 3 | 4 | 5 | 6 | 7
											}
											singleDayEvents={singleDayEvents}
											multiDayEvents={multiDayEvents}
										/>
									</DayWeekDndProvider>
								) : null}
								{view === "agenda" ? (
									<CalendarAgendaView
										singleDayEvents={singleDayEvents}
										multiDayEvents={multiDayEvents}
									/>
								) : null}
							</>
						)}
					</div>
				</div>
				{taskSidebarOpen && <TaskSidebar />}
			</div>
		</div>
	);
}
