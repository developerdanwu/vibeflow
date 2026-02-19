import {
	addDays,
	addMonths,
	differenceInDays,
	differenceInMinutes,
	eachDayOfInterval,
	endOfDay,
	endOfMonth,
	format,
	isWithinInterval,
	parseISO,
	startOfDay,
	startOfMonth,
	subMonths,
} from "date-fns";

import type { ICalendarCell, TEvent } from "./interfaces";
import type {
	TCalendarView,
	TDayRange,
	TVisibleHours,
	TWorkingHours,
} from "./types";

// ================ dayRange helper ================ //

/** Number of days for multi-day view, or null for month. */
export function dayRangeToDayCount(dayRange: TDayRange): number | null {
	if (dayRange === "M") return null;
	if (dayRange === "W") return 7;
	return Number.parseInt(dayRange, 10);
}

/**
 * Start and end timestamps (ms) for the calendar's visible range.
 * Used to fetch events via getEventsByDateRange.
 */
export function getCalendarVisibleRange(
	view: "calendar" | "agenda",
	date: Date,
	dayRange: TDayRange,
): { startTimestamp: number; endTimestamp: number } {
	const dayCount = dayRangeToDayCount(dayRange);
	if (view === "agenda") {
		if (dayCount === null) {
			return {
				startTimestamp: startOfMonth(date).getTime(),
				endTimestamp: endOfMonth(date).getTime(),
			};
		}
		const start = startOfDay(date);
		const end = endOfDay(addDays(date, dayCount - 1));
		return {
			startTimestamp: start.getTime(),
			endTimestamp: end.getTime(),
		};
	}
	if (dayCount === null) {
		return {
			startTimestamp: startOfMonth(date).getTime(),
			endTimestamp: endOfMonth(date).getTime(),
		};
	}
	const start = startOfDay(date);
	const end = endOfDay(addDays(date, dayCount - 1));
	return {
		startTimestamp: start.getTime(),
		endTimestamp: end.getTime(),
	};
}

export function navigateDate(
	date: Date,
	_view: TCalendarView,
	direction: "previous" | "next",
): Date {
	const op = direction === "next" ? addMonths : subMonths;
	return op(date, 1);
}

// ================ Week and day view helper functions ================ //

export function getCurrentEvents(events: TEvent[]) {
	const now = new Date();
	return (
		events.filter((event) =>
			isWithinInterval(now, {
				start: parseISO(event.startDate),
				end: parseISO(event.endDate),
			}),
		) || null
	);
}

export function groupEvents(dayEvents: TEvent[]) {
	const sortedEvents = dayEvents.sort(
		(a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime(),
	);
	const groups: TEvent[][] = [];

	for (const event of sortedEvents) {
		const eventStart = parseISO(event.startDate);

		let placed = false;
		for (const group of groups) {
			const lastEventInGroup = group[group.length - 1];
			const lastEventEnd = parseISO(lastEventInGroup.endDate);

			if (eventStart >= lastEventEnd) {
				group.push(event);
				placed = true;
				break;
			}
		}

		if (!placed) groups.push([event]);
	}

	return groups;
}

export function getEventBlockStyle(
	event: TEvent,
	day: Date,
	groupIndex: number,
	groupSize: number,
	visibleHoursRange?: { from: number; to: number },
) {
	const startDate = parseISO(event.startDate);
	const dayStart = new Date(day.setHours(0, 0, 0, 0));
	const eventStart = startDate < dayStart ? dayStart : startDate;
	const startMinutes = differenceInMinutes(eventStart, dayStart);

	let top: number;

	if (visibleHoursRange) {
		const visibleStartMinutes = visibleHoursRange.from * 60;
		const visibleEndMinutes = visibleHoursRange.to * 60;
		const visibleRangeMinutes = visibleEndMinutes - visibleStartMinutes;
		top = ((startMinutes - visibleStartMinutes) / visibleRangeMinutes) * 100;
	} else {
		top = (startMinutes / 1440) * 100;
	}

	const width = 100 / groupSize;
	const left = groupIndex * width;

	return { top: `${top}%`, width: `${width}%`, left: `${left}%` };
}

export function isWorkingHour(
	day: Date,
	hour: number,
	workingHours: TWorkingHours,
) {
	const dayIndex = day.getDay() as keyof typeof workingHours;
	const dayHours = workingHours[dayIndex];
	return hour >= dayHours.from && hour < dayHours.to;
}

export function getVisibleHours(
	visibleHours: TVisibleHours,
	singleDayEvents: TEvent[],
) {
	let earliestEventHour = visibleHours.from;
	let latestEventHour = visibleHours.to;

	singleDayEvents.forEach((event) => {
		const startHour = parseISO(event.startDate).getHours();
		const endTime = parseISO(event.endDate);
		const endHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0);
		if (startHour < earliestEventHour) earliestEventHour = startHour;
		if (endHour > latestEventHour) latestEventHour = endHour;
	});

	latestEventHour = Math.min(latestEventHour, 24);

	const hours = Array.from(
		{ length: latestEventHour - earliestEventHour },
		(_, i) => i + earliestEventHour,
	);

	return { hours, earliestEventHour, latestEventHour };
}

// ================ Month view helper functions ================ //

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
	const currentYear = selectedDate.getFullYear();
	const currentMonth = selectedDate.getMonth();

	const getDaysInMonth = (year: number, month: number) =>
		new Date(year, month + 1, 0).getDate();
	const getFirstDayOfMonth = (year: number, month: number) =>
		new Date(year, month, 1).getDay();

	const daysInMonth = getDaysInMonth(currentYear, currentMonth);
	const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
	const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
	const totalDays = firstDayOfMonth + daysInMonth;

	const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
		day: daysInPrevMonth - firstDayOfMonth + i + 1,
		currentMonth: false,
		date: new Date(
			currentYear,
			currentMonth - 1,
			daysInPrevMonth - firstDayOfMonth + i + 1,
		),
	}));

	const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
		day: i + 1,
		currentMonth: true,
		date: new Date(currentYear, currentMonth, i + 1),
	}));

	const nextMonthCells = Array.from(
		{ length: (7 - (totalDays % 7)) % 7 },
		(_, i) => ({
			day: i + 1,
			currentMonth: false,
			date: new Date(currentYear, currentMonth + 1, i + 1),
		}),
	);

	return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];
}

export function calculateMonthEventPositions(
	multiDayEvents: TEvent[],
	singleDayEvents: TEvent[],
	selectedDate: Date,
) {
	const monthStart = startOfMonth(selectedDate);
	const monthEnd = endOfMonth(selectedDate);

	const eventPositions: { [key: string]: number } = {};
	const occupiedPositions: { [key: string]: boolean[] } = {};

	eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
		occupiedPositions[day.toISOString()] = [false, false, false];
	});

	const sortedEvents = [
		...multiDayEvents.sort((a, b) => {
			const aDuration = differenceInDays(
				parseISO(a.endDate),
				parseISO(a.startDate),
			);
			const bDuration = differenceInDays(
				parseISO(b.endDate),
				parseISO(b.startDate),
			);
			return (
				bDuration - aDuration ||
				parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
			);
		}),
		...singleDayEvents.sort(
			(a, b) =>
				parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime(),
		),
	];

	sortedEvents.forEach((event) => {
		const eventStart = parseISO(event.startDate);
		const eventEnd = parseISO(event.endDate);
		const eventDays = eachDayOfInterval({
			start: eventStart < monthStart ? monthStart : eventStart,
			end: eventEnd > monthEnd ? monthEnd : eventEnd,
		});

		let position = -1;

		for (let i = 0; i < 3; i++) {
			if (
				eventDays.every((day) => {
					const dayPositions = occupiedPositions[startOfDay(day).toISOString()];
					return dayPositions && !dayPositions[i];
				})
			) {
				position = i;
				break;
			}
		}

		if (position !== -1) {
			eventDays.forEach((day) => {
				const dayKey = startOfDay(day).toISOString();
				occupiedPositions[dayKey][position] = true;
			});
			eventPositions[event.id] = position;
		}
	});

	return eventPositions;
}

export function getMonthCellEvents(
	date: Date,
	events: TEvent[],
	eventPositions: Record<string, number>,
) {
	const day = startOfDay(date);
	const eventsForDate = events.filter((event) => isEventOnDate(event, day));

	return eventsForDate
		.map((event) => ({
			...event,
			position: eventPositions[event.id] ?? -1,
			isMultiDay: event.startDate !== event.endDate,
		}))
		.sort((a, b) => {
			if (a.isMultiDay && !b.isMultiDay) return -1;
			if (!a.isMultiDay && b.isMultiDay) return 1;
			return a.position - b.position;
		});
}

// ================ New date helper functions ================ //

/**
 * Gets the calendar date (YYYY-MM-DD) for display purposes.
 * For all-day events, uses startDateStr/endDateStr directly.
 * For timed events, derives from startDate ISO string.
 */
export function getEventCalendarDate(
	event: {
		startDateStr?: string;
		endDateStr?: string;
		startDate?: string;
		endDate?: string;
	},
	which: "start" | "end",
): string {
	if (which === "start") {
		if (event.startDateStr) return event.startDateStr;
		if (event.startDate) return event.startDate.slice(0, 10);
	} else {
		if (event.endDateStr) return event.endDateStr;
		if (event.endDate) return event.endDate.slice(0, 10);
	}
	throw new Error(`Missing date field for ${which}`);
}

const TIMEZONE_OFFSETS: Record<string, number> = {
	"America/Los_Angeles": -8,
	"America/Denver": -7,
	"America/Chicago": -6,
	"America/New_York": -5,
	"Europe/London": 0,
	"Europe/Paris": 1,
	"Asia/Tokyo": 9,
	"Australia/Sydney": 11,
};

export function deriveNumericTimestamp(
	date: string,
	time?: string,
	timezone?: string,
): number {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
	}
	if (time) {
		if (!/^\d{2}:\d{2}$/.test(time)) {
			throw new Error(`Invalid time format: ${time}. Expected HH:mm`);
		}
		if (timezone && TIMEZONE_OFFSETS[timezone] !== undefined) {
			const offset = TIMEZONE_OFFSETS[timezone];
			const utcDate = new Date(`${date}T${time}:00.000Z`);
			return utcDate.getTime() - offset * 60 * 60 * 1000;
		}
		return new Date(`${date}T${time}:00.000Z`).getTime();
	}
	return new Date(`${date}T00:00:00.000Z`).getTime();
}

export function isEventOnDate(
	event: {
		allDay?: boolean;
		startDateStr?: string;
		endDateStr?: string;
		startDate?: string;
		endDate?: string;
	},
	date: Date,
): boolean {
	const dateStr = format(date, "yyyy-MM-dd");
	if (event.startDateStr && event.endDateStr) {
		if (event.startDateStr === event.endDateStr)
			return dateStr === event.startDateStr;
		return dateStr >= event.startDateStr && dateStr < event.endDateStr;
	}
	if (event.startDate && event.endDate) {
		const eventStart = event.startDate.slice(0, 10);
		const eventEnd = event.endDate.slice(0, 10);
		return dateStr >= eventStart && dateStr <= eventEnd;
	}
	return false;
}

export function formatEventTime(event: {
	allDay?: boolean;
	startTime?: string;
	timeZone?: string;
}): string | null {
	if (event.allDay || !event.startTime) return null;
	const [hours, minutes] = event.startTime.split(":").map(Number);
	const period = hours >= 12 ? "PM" : "AM";
	const displayHours = hours % 12 || 12;
	return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}
