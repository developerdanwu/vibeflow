"use client";

import { cn } from "@/lib/utils";
import { useMoveDropRange } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/use-move-drop-range";
import { isSameDay } from "date-fns";

const SLOT_DURATION_MS = 15 * 60 * 1000;
const SLOT_HEIGHT_PX = 24;

interface DropRangeRingProps {
	/** The date this column represents (single column for day view, one per column for week view). */
	day: Date;
	/** First hour of the visible grid (e.g. hours[0] from getVisibleHours). */
	firstHour: number;
	/** Optional extra class for the ring element. */
	className?: string;
}

/**
 * Renders a ring overlay showing where a dragged event would drop when moving (not resizing).
 * The ring spans the full event duration. Only one column (day) is highlighted per view.
 */
export function DropRangeRing({
	day,
	firstHour,
	className,
}: DropRangeRingProps) {
	const moveDropRange = useMoveDropRange();
	if (!moveDropRange) return null;
	const dropStart = moveDropRange.startTimestamp;
	const dropEnd = moveDropRange.endTimestamp;
	if (!isSameDay(new Date(dropStart), day)) return null;

	const gridDayStart = new Date(day);
	gridDayStart.setHours(firstHour, 0, 0, 0);
	const gridStartMs = gridDayStart.getTime();
	const topPx = ((dropStart - gridStartMs) / SLOT_DURATION_MS) * SLOT_HEIGHT_PX;
	const heightPx = ((dropEnd - dropStart) / SLOT_DURATION_MS) * SLOT_HEIGHT_PX;
	if (heightPx <= 0) return null;

	return (
		<div
			className={cn(
				"pointer-events-none absolute inset-x-0 z-10 rounded-sm ring-2 ring-primary",
				className,
			)}
			style={{
				top: topPx,
				height: heightPx,
			}}
			aria-hidden
		/>
	);
}
