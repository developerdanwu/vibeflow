import { AgendaDayGroup } from "@/components/big-calendar/components/agenda-view/agenda-day-group";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Route } from "@/routes/_authenticated/calendar";
import {
	addDays,
	endOfDay,
	endOfMonth,
	format,
	parseISO,
	startOfDay,
} from "date-fns";
import { CalendarSearch, CalendarX2 } from "lucide-react";
import { useMemo, useState } from "react";

interface IProps {
	singleDayEvents: TEvent[];
	multiDayEvents: TEvent[];
}

function eventMatchesSearch(event: TEvent, query: string): boolean {
	if (!query.trim()) return true;
	const q = query.trim().toLowerCase();
	return (
		event.title.toLowerCase().includes(q) ||
		event.description.toLowerCase().includes(q)
	);
}

export function CalendarAgendaView({
	singleDayEvents,
	multiDayEvents,
}: IProps) {
	const { date: selectedDate, agendaRange } = Route.useSearch();
	const effectiveRange = agendaRange ?? "7";
	const [searchQuery, setSearchQuery] = useState("");

	const { rangeStart, rangeEnd } = useMemo(() => {
		const start = startOfDay(selectedDate);
		const end =
			effectiveRange === "month"
				? endOfMonth(selectedDate)
				: endOfDay(
						addDays(selectedDate, Number.parseInt(effectiveRange, 10) - 1),
					);
		return { rangeStart: start, rangeEnd: end };
	}, [selectedDate, effectiveRange]);

	const eventsByDay = useMemo(() => {
		const allDates = new Map<
			string,
			{ date: Date; events: TEvent[]; multiDayEvents: TEvent[] }
		>();

		singleDayEvents.forEach((event) => {
			const eventDate = startOfDay(parseISO(event.startDate));
			if (eventDate < rangeStart || eventDate > rangeEnd) return;

			const dateKey = format(eventDate, "yyyy-MM-dd");

			if (!allDates.has(dateKey)) {
				allDates.set(dateKey, {
					date: eventDate,
					events: [],
					multiDayEvents: [],
				});
			}

			allDates.get(dateKey)?.events.push(event);
		});

		multiDayEvents.forEach((event) => {
			const eventStart = parseISO(event.startDate);
			const eventEnd = parseISO(event.endDate);

			let currentDate = startOfDay(eventStart);
			const lastDate = endOfDay(eventEnd);

			while (currentDate <= lastDate) {
				if (currentDate >= rangeStart && currentDate <= rangeEnd) {
					const dateKey = format(currentDate, "yyyy-MM-dd");

					if (!allDates.has(dateKey)) {
						allDates.set(dateKey, {
							date: new Date(currentDate),
							events: [],
							multiDayEvents: [],
						});
					}

					allDates.get(dateKey)?.multiDayEvents.push(event);
				}
				currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
			}
		});

		return Array.from(allDates.values()).sort(
			(a, b) => a.date.getTime() - b.date.getTime(),
		);
	}, [singleDayEvents, multiDayEvents, rangeStart, rangeEnd]);

	const filteredBySearch = useMemo(() => {
		if (!searchQuery.trim()) return eventsByDay;
		return eventsByDay
			.map((day) => ({
				...day,
				events: day.events.filter((e) => eventMatchesSearch(e, searchQuery)),
				multiDayEvents: day.multiDayEvents.filter((e) =>
					eventMatchesSearch(e, searchQuery),
				),
			}))
			.filter((day) => day.events.length > 0 || day.multiDayEvents.length > 0);
	}, [eventsByDay, searchQuery]);

	const hasAnyEvents = singleDayEvents.length > 0 || multiDayEvents.length > 0;
	const hasResults = filteredBySearch.length > 0;
	const isSearching = searchQuery.trim().length > 0;

	return (
		<ScrollArea className="h-full">
			<div className="flex flex-col">
				<div className="sticky top-0 z-10 border-b bg-background px-4 py-2">
					<div className="relative">
						<CalendarSearch className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search events"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8"
						/>
					</div>
				</div>
				<div className="space-y-6 p-4">
					{filteredBySearch.map((dayGroup) => (
						<AgendaDayGroup
							key={format(dayGroup.date, "yyyy-MM-dd")}
							date={dayGroup.date}
							events={dayGroup.events}
							multiDayEvents={dayGroup.multiDayEvents}
						/>
					))}

					{!hasAnyEvents && (
						<div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
							<CalendarX2 className="size-10" />
							<p className="text-sm md:text-base">
								No events scheduled for the selected period
							</p>
						</div>
					)}

					{hasAnyEvents && !hasResults && (
						<div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
							<CalendarSearch className="size-10" />
							<p className="text-sm md:text-base">
								{isSearching
									? `No events match "${searchQuery}"`
									: "No events in this date range"}
							</p>
						</div>
					)}
				</div>
			</div>
		</ScrollArea>
	);
}
