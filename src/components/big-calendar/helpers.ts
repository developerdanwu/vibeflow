import {
	addDays,
	addMonths,
	addWeeks,
	addYears,
	differenceInDays,
	differenceInMinutes,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	endOfYear,
	format,
	isSameDay,
	isSameMonth,
	isSameWeek,
	isSameYear,
	isWithinInterval,
	parseISO,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
	subDays,
	subMonths,
	subWeeks,
	subYears,
} from "date-fns";

import type {
	ICalendarCell,
	TEvent,
} from "@/components/big-calendar/interfaces";
import type {
	TCalendarView,
	TVisibleHours,
	TWorkingHours,
} from "@/components/big-calendar/types";

// ================ Header helper functions ================ //

export function rangeText(view: TCalendarView, date: Date) {
	const formatString = "MMM d, yyyy";
	let start: Date;
	let end: Date;

	switch (view) {
		case "agenda":
			start = startOfMonth(date);
			end = endOfMonth(date);
			break;
		case "year":
			start = startOfYear(date);
			end = endOfYear(date);
			break;
		case "month":
			start = startOfMonth(date);
			end = endOfMonth(date);
			break;
		case "week":
			start = startOfWeek(date);
			end = endOfWeek(date);
			break;
		case "day":
			return format(date, formatString);
		default:
			return "Error while formatting ";
	}

	return `${format(start, formatString)} - ${format(end, formatString)}`;
}

export function navigateDate(
	date: Date,
	view: TCalendarView,
	direction: "previous" | "next",
): Date {
	const operations = {
		agenda: direction === "next" ? addMonths : subMonths,
		year: direction === "next" ? addYears : subYears,
		month: direction === "next" ? addMonths : subMonths,
		week: direction === "next" ? addWeeks : subWeeks,
		day: direction === "next" ? addDays : subDays,
	};

	return operations[view](date, 1);
}

export function getEventsCount(
	events: TEvent[],
	date: Date,
	view: TCalendarView,
): number {
	const compareFns = {
		agenda: isSameMonth,
		year: isSameYear,
		day: isSameDay,
		week: isSameWeek,
		month: isSameMonth,
	};

	return events.filter((event) =>
		compareFns[view](new Date(event.startDate), date),
	).length;
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
	const eventsForDate = events.filter((event) => {
		const eventStart = parseISO(event.startDate);
		const eventEnd = parseISO(event.endDate);
		return (
			(date >= eventStart && date <= eventEnd) ||
			isSameDay(date, eventStart) ||
			isSameDay(date, eventEnd)
		);
	});

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
		// Prefer startDateStr for all-day events
		if (event.startDateStr) {
			return event.startDateStr;
		}
		// Fallback to startDate ISO string
		if (event.startDate) {
			return event.startDate.slice(0, 10); // Extract YYYY-MM-DD from ISO
		}
	} else {
		// Prefer endDateStr for all-day events
		if (event.endDateStr) {
			return event.endDateStr;
		}
		// Fallback to endDate ISO string
		if (event.endDate) {
			return event.endDate.slice(0, 10);
		}
	}
	throw new Error(`Missing date field for ${which}`);
}

/**
 * Timezone offset map for common timezones (in hours from UTC)
 */
const TIMEZONE_OFFSETS: Record<string, number> = {
	"America/Los_Angeles": -8, // PST
	"America/Denver": -7, // MST
	"America/Chicago": -6, // CST
	"America/New_York": -5, // EST
	"Europe/London": 0, // GMT
	"Europe/Paris": 1, // CET
	"Asia/Tokyo": 9, // JST
	"Australia/Sydney": 11, // AEDT
};

/**
 * Converts Notion-style date fields to UTC timestamp (milliseconds).
 * - Date only: midnight UTC of that date
 * - Date + time + timezone: interprets time in given timezone, converts to UTC
 */
export function deriveNumericTimestamp(
	date: string,
	time?: string,
	timezone?: string,
): number {
	// Validate date format YYYY-MM-DD
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
	}

	if (time) {
		// Validate time format HH:mm
		if (!/^\d{2}:\d{2}$/.test(time)) {
			throw new Error(`Invalid time format: ${time}. Expected HH:mm`);
		}

		// If timezone provided, convert from that timezone to UTC
		if (timezone && TIMEZONE_OFFSETS[timezone] !== undefined) {
			const offset = TIMEZONE_OFFSETS[timezone];
			// Create date in UTC first
			const utcDate = new Date(`${date}T${time}:00.000Z`);
			// Adjust by timezone offset (subtract because offset is from UTC)
			const adjustedTime = utcDate.getTime() - offset * 60 * 60 * 1000;
			return adjustedTime;
		}

		// No timezone or unknown timezone - interpret as UTC
		return new Date(`${date}T${time}:00.000Z`).getTime();
	}

	// Date only - midnight UTC
	return new Date(`${date}T00:00:00.000Z`).getTime();
}

/**
 * Checks if an event should display on a given calendar date.
 * Uses exclusive endDateStr semantics (endDateStr is first day NOT included).
 */
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
		// All-day event with Notion-style fields
		// Exclusive end: event on Jan 1-3 with endDateStr="2026-01-03" shows on Jan 1, 2 only
		// But for single-day events (start == end), include that day
		if (event.startDateStr === event.endDateStr) {
			return dateStr === event.startDateStr;
		}
		return dateStr >= event.startDateStr && dateStr < event.endDateStr;
	}

	if (event.startDate && event.endDate) {
		// Timed event - check if date falls within range
		const eventStart = event.startDate.slice(0, 10);
		const eventEnd = event.endDate.slice(0, 10);
		return dateStr >= eventStart && dateStr <= eventEnd;
	}

	return false;
}

/**
 * Formats the event time for display.
 * Returns null for all-day events.
 */
export function formatEventTime(event: {
	allDay?: boolean;
	startTime?: string;
	timeZone?: string;
}): string | null {
	if (event.allDay) {
		return null;
	}

	if (!event.startTime) {
		return null;
	}

	// Parse HH:mm and format as 12-hour time
	const [hours, minutes] = event.startTime.split(":").map(Number);
	const period = hours >= 12 ? "PM" : "AM";
	const displayHours = hours % 12 || 12;

	return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}
