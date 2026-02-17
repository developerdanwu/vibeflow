import { AgendaDayGroup } from "@/components/big-calendar/components/agenda-view/agenda-day-group";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Route } from "@/routes/_authenticated/calendar";
import { endOfDay, format, isSameMonth, parseISO, startOfDay } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { useMemo } from "react";

interface IProps {
	singleDayEvents: TEvent[];
	multiDayEvents: TEvent[];
}

export function CalendarAgendaView({
	singleDayEvents,
	multiDayEvents,
}: IProps) {
	const { date: selectedDate } = Route.useSearch();

	const eventsByDay = useMemo(() => {
		const allDates = new Map<
			string,
			{ date: Date; events: TEvent[]; multiDayEvents: TEvent[] }
		>();

		singleDayEvents.forEach((event) => {
			const eventDate = parseISO(event.startDate);
			if (!isSameMonth(eventDate, selectedDate)) return;

			const dateKey = format(eventDate, "yyyy-MM-dd");

			if (!allDates.has(dateKey)) {
				allDates.set(dateKey, {
					date: startOfDay(eventDate),
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
				if (isSameMonth(currentDate, selectedDate)) {
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
	}, [singleDayEvents, multiDayEvents, selectedDate]);

	const hasAnyEvents = singleDayEvents.length > 0 || multiDayEvents.length > 0;

	return (
		<ScrollArea className="h-full">
			<div className="space-y-6 p-4">
				{eventsByDay.map((dayGroup) => (
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
							No events scheduled for the selected month
						</p>
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
