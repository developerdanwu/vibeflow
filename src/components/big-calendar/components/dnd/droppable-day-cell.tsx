"use client";

import { ZCalendarDragData } from "@/components/big-calendar/components/dnd/dnd-schemas";
import type { UpdateEventPayload } from "@/components/big-calendar/hooks/use-update-event-mutation";
import type {
	ICalendarCell,
	TEvent,
} from "@/components/big-calendar/interfaces";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import {
	addDays,
	differenceInDays,
	format,
	parseISO,
	set,
	startOfDay,
} from "date-fns";
import type { HTMLAttributes } from "react";

interface DroppableDayCellProps extends HTMLAttributes<HTMLDivElement> {
	cell: ICalendarCell;
}

function dayCellId(cell: ICalendarCell): string {
	return `day-${cell.date.getTime()}`;
}

export function DroppableDayCell({
	cell,
	className,
	children,
	...rest
}: DroppableDayCellProps) {
	const { active } = useDndContext();
	const { isOver, setNodeRef } = useDroppable({
		id: dayCellId(cell),
		data: {
			type: "day-cell",
			cell,
		},
	});
	const activeResult = ZCalendarDragData.safeParse(active?.data?.current);
	const activeData = activeResult.success ? activeResult.data : undefined;
	const isDropTarget = isOver && activeData?.type === "event";

	return (
		<div
			ref={setNodeRef}
			className={cn(
				"h-full",
				isOver && "bg-accent/50",
				isDropTarget && "relative z-10",
				className,
			)}
			{...rest}
		>
			{children}
			{isDropTarget && (
				<div
					className="pointer-events-none absolute inset-0 z-10 rounded-lg ring-2 ring-primary"
					aria-hidden
				/>
			)}
		</div>
	);
}

/** Convert event to all-day on the given date (single day). Used when dropping onto all-day section in day/week view. */
export function moveEventToAllDay(
	event: TEvent,
	cellDate: Date,
	updateEvent: (payload: UpdateEventPayload) => Promise<unknown>,
): void {
	if (!event.convexId) return;
	const dateStr = format(startOfDay(cellDate), "yyyy-MM-dd");
	updateEvent({
		id: event.convexId as Id<"events">,
		allDay: true,
		startDateStr: dateStr,
		endDateStr: dateStr,
	});
}

/** Move event to a new day (month view day cell). Used from DndContext onDragEnd. */
export function moveEventToDay(
	event: TEvent,
	cellDate: Date,
	updateEvent: (payload: UpdateEventPayload) => Promise<unknown>,
): void {
	if (!event.convexId) return;
	const eventStartDate = parseISO(event.startDate);
	const eventEndDate = parseISO(event.endDate);
	const newStartDate = set(startOfDay(cellDate), {
		hours: eventStartDate.getHours(),
		minutes: eventStartDate.getMinutes(),
		seconds: eventStartDate.getSeconds(),
		milliseconds: eventStartDate.getMilliseconds(),
	});
	const daysDiff = differenceInDays(newStartDate, eventStartDate);
	if (daysDiff === 0) return;
	const newEndDate = addDays(eventEndDate, daysDiff);

	const basePayload = {
		id: event.convexId as Id<"events">,
		allDay: event.allDay,
	};

	if (event.allDay) {
		updateEvent({
			...basePayload,
			startDateStr: format(newStartDate, "yyyy-MM-dd"),
			endDateStr: format(newEndDate, "yyyy-MM-dd"),
		});
	} else {
		updateEvent({
			...basePayload,
			startTimestamp: newStartDate.getTime(),
			endTimestamp: newEndDate.getTime(),
			startDateStr: format(newStartDate, "yyyy-MM-dd"),
			endDateStr: format(newEndDate, "yyyy-MM-dd"),
		});
	}
}
