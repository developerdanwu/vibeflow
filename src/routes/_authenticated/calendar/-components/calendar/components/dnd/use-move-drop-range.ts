import {
	ZCalendarDragData,
	ZTimeBlockOverData,
} from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/dnd-schemas";
import { useDndContext } from "@dnd-kit/core";
import { parseISO } from "date-fns";

const MIN_DURATION_MS = 15 * 60 * 1000;

/** When moving an event over time blocks, the range that would be occupied (for drop preview ring). */
export type MoveDropRange = {
	startTimestamp: number;
	endTimestamp: number;
} | null;

/**
 * Derives the move-drop range from DnD context (active + over). Returns the range when
 * dragging an event (not resizing) over a time block; otherwise null.
 */
export function useMoveDropRange(): MoveDropRange {
	const { active, over } = useDndContext();
	const activeResult = ZCalendarDragData.safeParse(active?.data.current);
	const overResult = ZTimeBlockOverData.safeParse(over?.data?.current);
	const activeData = activeResult.success ? activeResult.data : undefined;
	const overData = overResult.success ? overResult.data : undefined;

	if (!overData || !activeData) {
		return null;
	}
	if (activeData.type === "event-resize") {
		return null;
	}
	if (activeData.type !== "event") {
		return null;
	}

	const slotStartTimestamp = overData.slotStartTimestamp;
	const durationMs = activeData.event.allDay
		? MIN_DURATION_MS
		: parseISO(activeData.event.endDate).getTime() -
			parseISO(activeData.event.startDate).getTime();
	return {
		startTimestamp: slotStartTimestamp,
		endTimestamp: slotStartTimestamp + durationMs,
	};
}
