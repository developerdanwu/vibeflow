/**
 * Build RRULE string(s) for Google Calendar API from form recurrence options.
 * Google expects an array of RRULE-only strings (e.g. ["RRULE:FREQ=WEEKLY;UNTIL=..."]).
 */
import { RRule } from "rrule";
import type { RecurrenceEndType, RecurrenceRuleType } from "./form-options";

export type BuildRecurrenceInput = {
	recurrenceRule: RecurrenceRuleType;
	recurrenceEnd: RecurrenceEndType;
	recurrenceEndDate?: Date;
	recurrenceCount?: number;
	/** Event start (used as dtstart and for UNTIL when end is onDate). */
	eventStart: Date;
};

const FREQ_MAP: Record<"daily" | "weekly" | "monthly", number> = {
	daily: RRule.DAILY,
	weekly: RRule.WEEKLY,
	monthly: RRule.MONTHLY,
};

/**
 * Returns an array of one RRULE string for createEvent recurrence, or empty if none.
 */
export function buildRecurrenceRruleStrings(input: BuildRecurrenceInput): string[] {
	const {
		recurrenceRule,
		recurrenceEnd,
		recurrenceEndDate,
		recurrenceCount,
		eventStart,
	} = input;

	if (recurrenceRule === "none") {
		return [];
	}

	const freq = FREQ_MAP[recurrenceRule];
	const options: Partial<{ freq: number; dtstart: Date; until: Date; count: number }> = {
		freq,
		dtstart: eventStart,
	};

	if (recurrenceEnd === "onDate" && recurrenceEndDate) {
		// UNTIL is exclusive in RRULE; use end of day so the end date is included.
		const until = new Date(recurrenceEndDate);
		until.setHours(23, 59, 59, 999);
		options.until = until;
	} else if (recurrenceEnd === "after" && recurrenceCount != null && recurrenceCount >= 1) {
		options.count = recurrenceCount;
	}
	// "never" = no until/count (infinite recurrence; Google accepts this)

	const rrule = new RRule(options);
	const full = rrule.toString();
	// toString() returns "DTSTART:...\nRRULE:FREQ=..."; Google wants only RRULE line(s).
	const rruleLine = full.split("\n").find((line) => line.startsWith("RRULE:"));
	return rruleLine ? [rruleLine] : [];
}
