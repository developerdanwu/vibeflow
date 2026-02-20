import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useGlobalStore } from "@/lib/global-store";
import { localStorageSearchMiddleware } from "@/lib/localStorageSearchMiddleware";
import { CalendarAgendaView } from "@/routes/_authenticated/calendar/-components/calendar/components/agenda-view/calendar-agenda-view";
import { CalendarAndTasksDndProvider } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/dnd-provider";
import { CalendarHeader } from "@/routes/_authenticated/calendar/-components/calendar/components/header/calendar-header";
import { CalendarMonthView } from "@/routes/_authenticated/calendar/-components/calendar/components/month-view/calendar-month-view";
import { CalendarMultiDayView } from "@/routes/_authenticated/calendar/-components/calendar/components/week-and-day-view/calendar-multi-day-view";
import { CalendarProvider } from "@/routes/_authenticated/calendar/-components/calendar/contexts/calendar-context";
import {
	dayRangeToDayCount,
	getCalendarVisibleRange,
} from "@/routes/_authenticated/calendar/-components/calendar/core/helpers";
import {
	type TEvent,
	type TUser,
	ZEventSchema,
} from "@/routes/_authenticated/calendar/-components/calendar/core/interfaces";
import type { TEventColor } from "@/routes/_authenticated/calendar/-components/calendar/core/types";
import { TaskSidebar } from "@/routes/_authenticated/calendar/-components/task-sidebar/task-sidebar";
import "@/styles/calendar.css";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { format, parse, startOfDay } from "date-fns";
import { useEffect, useMemo } from "react";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";
import { z } from "zod";

const dayRangeEnum = z.enum(["1", "2", "3", "4", "5", "6", "W", "M"]);

const calendarSearchSchema = z.object({
	view: z.enum(["calendar", "agenda"]).optional(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	dayRange: dayRangeEnum.optional(),
});

export type CalendarSearchOutput = Omit<
	Required<z.infer<typeof calendarSearchSchema>>,
	"date"
> & { date: Date };

export function useCalendarSearch(): CalendarSearchOutput {
	const search = Route.useSearch();
	const date = useMemo(() => {
		const dateStr = search.date ?? format(startOfDay(new Date()), "yyyy-MM-dd");
		return parse(dateStr, "yyyy-MM-dd", new Date());
	}, [search.date]);
	return {
		view: search.view ?? "calendar",
		dayRange: search.dayRange ?? "M",
		...search,
		date,
	};
}

export const Route = createFileRoute("/_authenticated/calendar/")({
	validateSearch: calendarSearchSchema,
	search: {
		middlewares: [
			localStorageSearchMiddleware<z.input<typeof calendarSearchSchema>>(
				calendarSearchSchema,
				{
					view: "calendar",
					dayRange: "M",
				},
				{
					view: "calendar-search-view",
					dayRange: "calendar-search-day-range",
				},
			),
		],
	},
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
	const { view, date, dayRange } = useCalendarSearch();
	const { auth } = useRouteContext({ from: "__root__" });
	const user = auth.user;
	const [_, store] = useGlobalStore();

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
	const taskPanelRef = usePanelRef();

	const { defaultLayout, onLayoutChanged } = useDefaultLayout({
		id: "calendar-page",
		storage: localStorage,
	});

	useEffect(() => {
		const openTaskPanel = store.on("openTaskPanel", () => {
			console.log("openTaskPanel", taskPanelRef.current?.expand());
			taskPanelRef.current?.expand();
		});

		const closeTaskPanel = store.on("closeTaskPanel", () => {
			console.log("closeTaskPanel");
			taskPanelRef.current?.collapse();
		});

		return () => {
			openTaskPanel.unsubscribe();
			closeTaskPanel.unsubscribe();
		};
	}, [store, taskPanelRef.current]);

	return (
		<div className="calendar-container flex min-h-0 flex-1 flex-col bg-background">
			<CalendarAndTasksDndProvider view={view} dayRange={dayRange}>
				<ResizablePanelGroup
					defaultLayout={defaultLayout}
					className="h-full min-h-0 min-w-0 flex-1"
					onLayoutChanged={(layout) => {
						if (taskPanelRef.current) {
							store.send({
								type: "syncTaskPanelOpen",
								taskPanelOpen: !taskPanelRef.current?.isCollapsed(),
							});
						}

						onLayoutChanged(layout);
					}}
					orientation="horizontal"
				>
					<ResizablePanel
						collapsible
						id="task-panel"
						defaultSize="25%"
						collapsedSize={0}
						maxSize={400}
						minSize={240}
						panelRef={taskPanelRef}
						className="flex min-h-0 min-w-0 flex-1 flex-col"
					>
						<TaskSidebar />
					</ResizablePanel>
					<ResizableHandle withHandle={false} />
					<ResizablePanel
						id="calendar-panel"
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
										<CalendarMonthView
											singleDayEvents={singleDayEvents}
											multiDayEvents={multiDayEvents}
										/>
									) : null}
									{view === "calendar" && dayRange !== "M" ? (
										<CalendarMultiDayView
											dayCount={
												dayRangeToDayCount(dayRange) as
													| 1
													| 2
													| 3
													| 4
													| 5
													| 6
													| 7
											}
											singleDayEvents={singleDayEvents}
											multiDayEvents={multiDayEvents}
										/>
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
				</ResizablePanelGroup>
			</CalendarAndTasksDndProvider>
		</div>
	);
}
