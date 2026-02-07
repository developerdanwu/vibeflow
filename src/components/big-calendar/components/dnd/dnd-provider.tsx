"use client";

import { CalendarDragOverlayContent } from "@/components/big-calendar/components/dnd/calendar-drag-overlay";
import {
	ZCalendarDragData,
	ZDayCellOverData,
	ZTimeBlockOverData,
} from "@/components/big-calendar/components/dnd/dnd-schemas";
import { moveEventToDay } from "@/components/big-calendar/components/dnd/droppable-day-cell";
import {
	moveEventToSlot,
	resizeEventToSlot,
} from "@/components/big-calendar/components/dnd/droppable-time-block";
import { useUpdateEventMutation } from "@/components/big-calendar/hooks/use-update-event-mutation";
import type { DragEndEvent, Modifier } from "@dnd-kit/core";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { parseISO } from "date-fns";

const DND_CONTEXT_ID_MONTH = "calendar-dnd-month";
const DND_CONTEXT_ID_DAY_WEEK = "calendar-dnd-day-week";

/** Restricts drag movement to the vertical axis (Y only). Used in day view. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
	...transform,
	x: 0,
});

/** Month view: day-cell drops only (move event to day). No onDragOver, no modifiers, no day-store. */
export function MonthDndProvider({ children }: { children: React.ReactNode }) {
	const { mutateAsync } = useUpdateEventMutation({
		meta: { updateType: "drag" },
	});
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
	);

	const onDragEnd = (event: DragEndEvent) => {
		const activeResult = ZCalendarDragData.safeParse(event.active.data.current);
		const overResult = ZDayCellOverData.safeParse(event.over?.data.current);
		const activeData = activeResult.success ? activeResult.data : undefined;
		const overData = overResult.success ? overResult.data : undefined;
		if (!activeData || !activeData.event?.convexId) {
			return;
		}
		if (!event.over || !overData) {
			return;
		}
		if (activeData.type === "event") {
			moveEventToDay(activeData.event, overData.cell.date, mutateAsync);
		}
	};

	return (
		<DndContext
			id={DND_CONTEXT_ID_MONTH}
			sensors={sensors}
			onDragEnd={onDragEnd}
		>
			{children}
			<DragOverlay>
				<CalendarDragOverlayContent />
			</DragOverlay>
		</DndContext>
	);
}

interface DayWeekDndProviderProps {
	children: React.ReactNode;
	view: "day" | "week";
}

/** Day/week view: time-block drops, resize preview, move-drop-range. No day-cell branch. */
export function DayWeekDndProvider({
	children,
	view,
}: DayWeekDndProviderProps) {
	const { mutateAsync } = useUpdateEventMutation({
		meta: { updateType: "drag" },
	});
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
	);
	const modifiers = view === "day" ? [restrictToVerticalAxis] : undefined;

	const onDragEnd = (event: DragEndEvent) => {
		const activeResult = ZCalendarDragData.safeParse(event.active.data.current);
		const overResult = ZTimeBlockOverData.safeParse(event.over?.data.current);
		const activeData = activeResult.success ? activeResult.data : undefined;
		const overData = overResult.success ? overResult.data : undefined;

		if (!activeData || !activeData.event.convexId) {
			return;
		}
		if (!event.over || !overData) {
			return;
		}

		const slotStartTimestamp = overData.slotStartTimestamp;
		if (activeData.type === "event-resize") {
			resizeEventToSlot(
				activeData.event,
				activeData.edge,
				slotStartTimestamp,
				mutateAsync,
			);
			return;
		}
		// Skip API when dropped on same slot (no change)
		const currentStart = parseISO(activeData.event.startDate).getTime();
		if (currentStart === slotStartTimestamp) return;
		moveEventToSlot(activeData.event, slotStartTimestamp, mutateAsync);
	};

	return (
		<DndContext
			id={DND_CONTEXT_ID_DAY_WEEK}
			sensors={sensors}
			modifiers={modifiers}
			onDragEnd={onDragEnd}
		>
			{children}
			<DragOverlay>
				<CalendarDragOverlayContent />
			</DragOverlay>
		</DndContext>
	);
}
