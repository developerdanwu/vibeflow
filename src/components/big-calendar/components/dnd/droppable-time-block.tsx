"use client";

import { ZTimeBlockOverData } from "@/components/big-calendar/components/dnd/dnd-schemas";
import type { UpdateEventPayload } from "@/components/big-calendar/hooks/use-update-event-mutation";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { useDroppable } from "@dnd-kit/core";
import { addMilliseconds, parseISO, set, startOfDay } from "date-fns";

const MIN_DURATION_MS = 15 * 60 * 1000;

interface DroppableTimeBlockProps {
	date: Date;
	hour: number;
	minute: number;
	children: React.ReactNode;
}

/** Unique id for a time slot (same day can have many slots). */
function timeBlockId(date: Date, hour: number, minute: number): string {
	return `time-${date.getTime()}-${hour}-${minute}`;
}

export function DroppableTimeBlock({
	date,
	hour,
	minute,
	children,
}: DroppableTimeBlockProps) {
	const slotStart = set(startOfDay(date), {
		hours: hour,
		minutes: minute,
		seconds: 0,
		milliseconds: 0,
	});
	const slotStartTimestamp = slotStart.getTime();

	const { isOver, setNodeRef } = useDroppable({
		id: timeBlockId(date, hour, minute),
		data: {
			type: "time-block",
			dateTimestamp: date.getTime(),
			hour,
			minute,
			slotStartTimestamp,
		},
	});

	return (
		<div ref={setNodeRef} className={cn("h-[24px]", isOver && "bg-accent/50")}>
			{children}
		</div>
	);
}

/** Helpers for DndContext onDragEnd/onDragOver: parse time-block drop data and run move/resize. */
export function getTimeBlockSlotStartTimestamp(
	data: unknown,
): number | undefined {
	const result = ZTimeBlockOverData.safeParse(data);
	return result.success ? result.data.slotStartTimestamp : undefined;
}

export function moveEventToSlot(
	event: TEvent,
	slotStartTimestamp: number,
	updateEvent: (payload: UpdateEventPayload) => Promise<unknown>,
): void {
	if (!event.convexId) return;
	const slotStart = new Date(slotStartTimestamp);
	const durationMs = event.allDay
		? MIN_DURATION_MS
		: parseISO(event.endDate).getTime() - parseISO(event.startDate).getTime();
	const newEndDate = addMilliseconds(slotStart, durationMs);
	updateEvent({
		id: event.convexId as Id<"events">,
		startTimestamp: slotStartTimestamp,
		endTimestamp: newEndDate.getTime(),
		allDay: false,
	});
}

export function resizeEventToSlot(
	event: TEvent,
	edge: "top" | "bottom",
	slotStartTimestamp: number,
	updateEvent: (payload: UpdateEventPayload) => Promise<unknown>,
): boolean {
	if (!event.convexId) return false;
	const eventStartTimestamp = parseISO(event.startDate).getTime();
	const eventEndTimestamp = parseISO(event.endDate).getTime();

	if (edge === "bottom") {
		if (slotStartTimestamp <= eventStartTimestamp) return false;
		if (slotStartTimestamp - eventStartTimestamp < MIN_DURATION_MS)
			return false;
		updateEvent({
			id: event.convexId as Id<"events">,
			endTimestamp: slotStartTimestamp,
		});
		return true;
	}
	if (slotStartTimestamp >= eventEndTimestamp) return false;
	if (eventEndTimestamp - slotStartTimestamp < MIN_DURATION_MS) return false;
	updateEvent({
		id: event.convexId as Id<"events">,
		startTimestamp: slotStartTimestamp,
	});
	return true;
}
