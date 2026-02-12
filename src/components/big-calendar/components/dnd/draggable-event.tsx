"use client";

import type {
	CalendarDragData,
	EventDragData,
	EventResizeDragData,
} from "@/components/big-calendar/components/dnd/dnd-schemas";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { useRef } from "react";
import { toast } from "sonner";

export type { CalendarDragData, EventDragData, EventResizeDragData };
export type EventResizeEdge = EventResizeDragData["edge"];

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
	const isLocked = event.isEditable === false;
	const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
	const DRAG_THRESHOLD = 5; // pixels

	const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
		id,
		data: {
			type: "event",
			event,
			...(sourceView && { sourceView }),
		} satisfies EventDragData,
	});

	const handlePointerDown = (e: React.PointerEvent) => {
		if (!isLocked) {
			return;
		}
		// Track initial pointer position
		pointerStartRef.current = { x: e.clientX, y: e.clientY };
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!isLocked || !pointerStartRef.current) {
			return;
		}

		const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
		const deltaY = Math.abs(e.clientY - pointerStartRef.current.y);
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		// Only show toast if user actually moved the pointer (drag attempt)
		if (distance > DRAG_THRESHOLD) {
			toast.error(
				"This event cannot be moved. It was created by someone else.",
			);
			// Prevent the drag from starting
			e.stopPropagation();
			e.preventDefault();
			pointerStartRef.current = null;
		}
	};

	const handlePointerUp = () => {
		pointerStartRef.current = null;
	};

	// For locked events, don't attach listeners and handle pointer events manually
	if (isLocked) {
		return (
			<div
				ref={setNodeRef}
				className={cn(isDragging && "opacity-40", "cursor-not-allowed")}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				{...attributes}
			>
				{children}
			</div>
		);
	}

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
	const isLocked = eventForData.isEditable === false;
	const id = `event-resize-${event.id}-${edge}`;
	const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
	const DRAG_THRESHOLD = 5; // pixels

	const { listeners, setNodeRef } = useDraggable({
		id,
		data: {
			type: "event-resize",
			event: eventForData,
			edge,
		} satisfies EventResizeDragData,
	});

	const handlePointerDown = (e: React.PointerEvent) => {
		if (!isLocked) {
			return;
		}
		// Track initial pointer position
		pointerStartRef.current = { x: e.clientX, y: e.clientY };
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!isLocked || !pointerStartRef.current) {
			return;
		}

		const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
		const deltaY = Math.abs(e.clientY - pointerStartRef.current.y);
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		// Only show toast if user actually moved the pointer (drag attempt)
		if (distance > DRAG_THRESHOLD) {
			toast.error(
				"This event cannot be resized. It was created by someone else.",
			);
			// Prevent the drag from starting
			e.stopPropagation();
			e.preventDefault();
			pointerStartRef.current = null;
		}
	};

	const handlePointerUp = () => {
		pointerStartRef.current = null;
	};

	// For locked events, don't attach listeners and handle pointer events manually
	if (isLocked) {
		return (
			<div
				ref={setNodeRef}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				className="cursor-not-allowed"
			>
				{children}
			</div>
		);
	}

	return (
		<div ref={setNodeRef} {...listeners}>
			{children}
		</div>
	);
}
