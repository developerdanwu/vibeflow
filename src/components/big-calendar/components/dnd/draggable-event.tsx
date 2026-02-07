"use client";

import type { TEvent } from "@/components/big-calendar/interfaces";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import type {
	CalendarDragData,
	EventDragData,
	EventResizeDragData,
} from "@/components/big-calendar/components/dnd/dnd-schemas";

export type { CalendarDragData, EventDragData, EventResizeDragData };
export type EventResizeEdge = EventResizeDragData["edge"];

export function isEventResizeData(
	data: CalendarDragData | undefined,
): data is EventResizeDragData {
	return data?.type === "event-resize";
}

interface DraggableEventProps {
	event: TEvent;
	/** When "month", overlay shows month-event badge style. */
	sourceView?: "month" | "week" | "day";
	children: React.ReactNode;
}

export function DraggableEvent({
	event,
	sourceView,
	children,
}: DraggableEventProps) {
	const id = `event-${event.id}`;
	const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
		id,
		data: {
			type: "event",
			event,
			...(sourceView && { sourceView }),
		} satisfies EventDragData,
	});

	return (
		<div
			ref={setNodeRef}
			className={cn(isDragging && "opacity-40")}
			{...listeners}
			{...attributes}
		>
			{children}
		</div>
	);
}

interface EventResizeHandleProps {
	event: TEvent;
	edge: EventResizeEdge;
	/** When provided, used for drag data so drop handler receives the real event (e.g. when parent passes displayEvent for layout but original for API). */
	originalEvent?: TEvent;
	children: React.ReactNode;
}

export function EventResizeHandle({
	event,
	edge,
	originalEvent,
	children,
}: EventResizeHandleProps) {
	const eventForData = originalEvent ?? event;
	const id = `event-resize-${event.id}-${edge}`;
	const { listeners, setNodeRef } = useDraggable({
		id,
		data: {
			type: "event-resize",
			event: eventForData,
			edge,
		} satisfies EventResizeDragData,
	});

	return (
		<div ref={setNodeRef} {...listeners}>
			{children}
		</div>
	);
}
