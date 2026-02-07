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
	children: React.ReactNode;
}

export function DraggableEvent({ event, children }: DraggableEventProps) {
	const id = `event-${event.id}`;
	const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
		id,
		data: {
			type: "event",
			event,
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
	children: React.ReactNode;
}

export function EventResizeHandle({
	event,
	edge,
	children,
}: EventResizeHandleProps) {
	const id = `event-resize-${event.id}-${edge}`;
	const { listeners, setNodeRef } = useDraggable({
		id,
		data: {
			type: "event-resize",
			event,
			edge,
		} satisfies EventResizeDragData,
	});

	return (
		<div ref={setNodeRef} {...listeners}>
			{children}
		</div>
	);
}
