import {
	calculateMonthEventPositions,
	deriveNumericTimestamp,
	formatEventTime,
	getEventCalendarDate,
	getMonthCellEvents,
	isEventOnDate,
} from "@/components/big-calendar/helpers";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { describe, expect, it } from "vitest";

interface IEventWithNotionFields extends Omit<TEvent, "allDay"> {
	allDay?: boolean;
	startDateStr?: string;
	endDateStr?: string;
	startTime?: string;
	endTime?: string;
	timeZone?: string;
}

// ================ getEventCalendarDate Tests ================ //

describe("getEventCalendarDate", () => {
	it("should return YYYY-MM-DD for all-day event with startDateStr", () => {
		const event: IEventWithNotionFields = {
			id: "1",
			startDate: "2026-01-15T00:00:00Z",
			endDate: "2026-01-15T23:59:59Z",
			title: "All-day event",
			color: "blue",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: true,
			startDateStr: "2026-01-15",
		};

		const result = getEventCalendarDate(event, "start");
		expect(result).toBe("2026-01-15");
	});

	it("should derive date from ISO startDate for timed event", () => {
		const event: IEventWithNotionFields = {
			id: "2",
			startDate: "2026-01-15T09:30:00Z",
			endDate: "2026-01-15T10:30:00Z",
			title: "Timed event",
			color: "green",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: false,
			timeZone: "America/Los_Angeles",
		};

		const result = getEventCalendarDate(event, "start");
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("should return end date for multi-day event when which='end'", () => {
		const event: IEventWithNotionFields = {
			id: "3",
			startDate: "2026-01-15T00:00:00Z",
			endDate: "2026-01-17T23:59:59Z",
			title: "Multi-day event",
			color: "red",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: true,
			startDateStr: "2026-01-15",
			endDateStr: "2026-01-17",
		};

		const result = getEventCalendarDate(event, "end");
		expect(result).toBe("2026-01-17");
	});

	it("should fallback to startDate ISO string when startDateStr is undefined", () => {
		const event: IEventWithNotionFields = {
			id: "4",
			startDate: "2026-01-20T14:00:00Z",
			endDate: "2026-01-20T15:00:00Z",
			title: "Event without start_date",
			color: "purple",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: false,
		};

		const result = getEventCalendarDate(event, "start");
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("should handle timezone conversion for timed events", () => {
		const event: IEventWithNotionFields = {
			id: "5",
			startDate: "2026-01-15T17:00:00Z",
			endDate: "2026-01-15T18:00:00Z",
			title: "Event with timezone",
			color: "yellow",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: false,
			startTime: "09:00",
			timeZone: "America/Los_Angeles",
		};

		const result = getEventCalendarDate(event, "start");
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

// ================ deriveNumericTimestamp Tests ================ //

describe("deriveNumericTimestamp", () => {
	it("should convert date-only string to midnight UTC milliseconds", () => {
		const result = deriveNumericTimestamp("2026-01-15");
		// 2026-01-15 00:00:00 UTC
		const expected = new Date("2026-01-15T00:00:00Z").getTime();
		expect(result).toBe(expected);
	});

	it("should convert date + time + timezone to correct UTC milliseconds", () => {
		const result = deriveNumericTimestamp(
			"2026-01-15",
			"09:00",
			"America/Los_Angeles",
		);
		// 2026-01-15 09:00 PST = 2026-01-15 17:00 UTC
		const expected = new Date("2026-01-15T17:00:00Z").getTime();
		expect(result).toBe(expected);
	});

	it("should treat missing timezone as UTC", () => {
		const result = deriveNumericTimestamp("2026-01-15", "14:30");
		// 2026-01-15 14:30 UTC
		const expected = new Date("2026-01-15T14:30:00Z").getTime();
		expect(result).toBe(expected);
	});

	it("should throw error for invalid date format", () => {
		expect(() => deriveNumericTimestamp("invalid-date")).toThrow();
	});

	it("should handle date with time but no timezone", () => {
		const result = deriveNumericTimestamp("2026-01-15", "10:00");
		const expected = new Date("2026-01-15T10:00:00Z").getTime();
		expect(result).toBe(expected);
	});
});

// ================ isEventOnDate Tests ================ //

describe("isEventOnDate", () => {
	it("should return true for all-day event on its startDateStr", () => {
		const event: IEventWithNotionFields = {
			id: "1",
			startDate: "2026-01-15T00:00:00Z",
			endDate: "2026-01-15T23:59:59Z",
			title: "All-day event",
			color: "blue",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: true,
			startDateStr: "2026-01-15",
			endDateStr: "2026-01-15",
		};

		const date = new Date("2026-01-15");
		const result = isEventOnDate(event, date);
		expect(result).toBe(true);
	});

	it("should return false for all-day event on day before startDateStr", () => {
		const event: IEventWithNotionFields = {
			id: "2",
			startDate: "2026-01-15T00:00:00Z",
			endDate: "2026-01-15T23:59:59Z",
			title: "All-day event",
			color: "blue",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: true,
			startDateStr: "2026-01-15",
			endDateStr: "2026-01-15",
		};

		const date = new Date("2026-01-14");
		const result = isEventOnDate(event, date);
		expect(result).toBe(false);
	});

	it("should return true for all-day multi-day event on middle day", () => {
		const event: IEventWithNotionFields = {
			id: "3",
			startDate: "2026-01-15T00:00:00Z",
			endDate: "2026-01-17T23:59:59Z",
			title: "Multi-day event",
			color: "red",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: true,
			startDateStr: "2026-01-15",
			endDateStr: "2026-01-17",
		};

		const date = new Date("2026-01-16");
		const result = isEventOnDate(event, date);
		expect(result).toBe(true);
	});

	it("should respect exclusive endDateStr semantics (endDateStr is exclusive)", () => {
		const event: IEventWithNotionFields = {
			id: "4",
			startDate: "2026-01-15T00:00:00Z",
			endDate: "2026-01-17T00:00:00Z",
			title: "Multi-day event",
			color: "red",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: true,
			startDateStr: "2026-01-15",
			endDateStr: "2026-01-17",
		};

		// end_date="2026-01-17" means last day is Jan 16
		const dateOnLastDay = new Date("2026-01-16");
		expect(isEventOnDate(event, dateOnLastDay)).toBe(true);

		const dateAfterEnd = new Date("2026-01-17");
		expect(isEventOnDate(event, dateAfterEnd)).toBe(false);
	});

	it("should return true for timed event on its date", () => {
		const event: IEventWithNotionFields = {
			id: "5",
			startDate: "2026-01-15T09:00:00Z",
			endDate: "2026-01-15T10:00:00Z",
			title: "Timed event",
			color: "green",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: false,
			startTime: "09:00",
			endTime: "10:00",
		};

		const date = new Date("2026-01-15");
		const result = isEventOnDate(event, date);
		expect(result).toBe(true);
	});
});

// ================ formatEventTime Tests ================ //

describe("formatEventTime", () => {
	it("should return null for all-day event", () => {
		const event: IEventWithNotionFields = {
			id: "1",
			startDate: "2026-01-15T00:00:00Z",
			endDate: "2026-01-15T23:59:59Z",
			title: "All-day event",
			color: "blue",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: true,
			startDateStr: "2026-01-15",
		};

		const result = formatEventTime(event);
		expect(result).toBeNull();
	});

	it("should return formatted time for timed event with timeZone", () => {
		const event: IEventWithNotionFields = {
			id: "2",
			startDate: "2026-01-15T17:00:00Z",
			endDate: "2026-01-15T18:00:00Z",
			title: "Timed event",
			color: "green",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: false,
			startTime: "09:00",
			timeZone: "America/Los_Angeles",
		};

		const result = formatEventTime(event);
		expect(result).toBeTruthy();
		expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM|am|pm)?/);
	});

	it("should return null for event without time fields", () => {
		const event: IEventWithNotionFields = {
			id: "3",
			startDate: "2026-01-15T00:00:00Z",
			endDate: "2026-01-15T23:59:59Z",
			title: "Event without time",
			color: "purple",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
		};

		const result = formatEventTime(event);
		expect(result).toBeNull();
	});

	it("should format time correctly for timed event", () => {
		const event: IEventWithNotionFields = {
			id: "4",
			startDate: "2026-01-15T14:30:00Z",
			endDate: "2026-01-15T15:30:00Z",
			title: "Afternoon event",
			color: "yellow",
			description: "",
			user: { id: "user1", name: "Test User", picturePath: null },
			allDay: false,
			startTime: "14:30",
		};

		const result = formatEventTime(event);
		expect(result).toBeTruthy();
		expect(result).toMatch(/\d{1,2}:\d{2}/);
	});
});

// ================ getMonthCellEvents Tests ================ //

describe("getMonthCellEvents", () => {
	const user = {
		id: "user1",
		name: "Test User",
		picturePath: null as string | null,
	};

	it("should include timed event on its calendar day with valid position", () => {
		const timedEvent: TEvent = {
			id: "timed-1",
			startDate: "2026-02-07T08:00:00.000Z",
			endDate: "2026-02-07T09:00:00.000Z",
			title: "Timed event",
			color: "blue",
			description: "",
			user,
			allDay: false,
		};
		const cellDate = new Date("2026-02-07");
		const eventPositions: Record<string, number> = { "timed-1": 0 };
		const result = getMonthCellEvents(cellDate, [timedEvent], eventPositions);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("timed-1");
		expect(result[0].position).toBe(0);
	});
});

// ================ calculateMonthEventPositions Tests ================ //

describe("calculateMonthEventPositions", () => {
	const user = {
		id: "user1",
		name: "Test User",
		picturePath: null as string | null,
	};

	it("should assign a position to a single-day timed event", () => {
		const timedEvent: TEvent = {
			id: "timed-1",
			startDate: "2026-02-07T08:00:00.000Z",
			endDate: "2026-02-07T09:00:00.000Z",
			title: "Timed event",
			color: "green",
			description: "",
			user,
			allDay: false,
		};
		const selectedDate = new Date("2026-02-07");
		const positions = calculateMonthEventPositions(
			[],
			[timedEvent],
			selectedDate,
		);
		expect(positions["timed-1"]).toBeDefined();
		expect(positions["timed-1"]).toBeGreaterThanOrEqual(0);
		expect(positions["timed-1"]).toBeLessThanOrEqual(2);
	});
});
