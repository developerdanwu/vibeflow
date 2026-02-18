import { CalendarAgendaView } from "@/components/big-calendar/components/agenda-view/calendar-agenda-view";
import {
	DayWeekDndProvider,
	MonthDndProvider,
} from "@/components/big-calendar/components/dnd/dnd-provider";
import { CalendarHeader } from "@/components/big-calendar/components/header/calendar-header";
import { CalendarMonthView } from "@/components/big-calendar/components/month-view/calendar-month-view";
import { TaskSidebar } from "@/components/big-calendar/components/task-sidebar/task-sidebar";
import { CalendarMultiDayView } from "@/components/big-calendar/components/week-and-day-view/calendar-multi-day-view";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
	dayRangeToDayCount,
	getCalendarVisibleRange,
} from "@/components/big-calendar/helpers";
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
import { useAppAuth } from "@/lib/auth-context";
import { useMemo, useState } from "react";
import { z } from "zod";

const dayRangeEnum = z.enum(["1", "2", "3", "4", "5", "6", "W", "M"]);

const calendarSearchSchema = z
	.object({
		view: z.enum(["calendar", "agenda"]).default("calendar"),
		date: z.coerce.date().optional(),
		day: z.coerce.date().optional(),
		dayRange: dayRangeEnum.default("M"),
	})
	.transform(({ view, date, day, dayRange }) => ({
		view,
		date: date ?? day ?? new Date(),
		dayRange,
	}));

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
	const { view, date, dayRange } = Route.useSearch();
	const { user } = useAppAuth();

	const currentUser: TUser | null = user
		? {
				id: user.id,
				name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
				picturePath: user.profilePictureUrl ?? null,
			}
		: null;

	const dateRange = useMemo(
		() => getCalendarVisibleRange(view, date, dayRange),
		[view, date, dayRange],
	);

	const { data: convexEvents } = useQuery(
		convexQuery(api.events.queries.getEventsByDateRange, {
			startTimestamp: dateRange.startTimestamp,
			endTimestamp: dateRange.endTimestamp,
		}),
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
		<div className="calendar-container flex min-h-0 flex-1 flex-col bg-background">
			<ResizablePanelGroup
				className="h-full min-h-0 min-w-0 flex-1"
				orientation="horizontal"
			>
				<ResizablePanel
					defaultSize="75%"
					minSize="30%"
					className="flex min-h-0 min-w-0 flex-1 flex-col"
				>
					<div className="flex shrink-0 items-center gap-1">
						<CalendarHeader dayRange={dayRange} events={events} />
					</div>
					<div className="flex min-h-0 flex-1 flex-col">
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
				</ResizablePanel>
				{taskSidebarOpen ? (
					<>
						<ResizableHandle withHandle />
						<ResizablePanel
							defaultSize="25%"
							maxSize={400}
							minSize={240}
							className="flex min-h-0 min-w-0 flex-1 flex-col"
						>
							<TaskSidebar />
						</ResizablePanel>
					</>
				) : null}
			</ResizablePanelGroup>
		</div>
	);
}
