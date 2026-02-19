"use client";

import { dialogStore } from "@/lib/dialog-store";
import { CalendarDragOverlayContent } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/calendar-drag-overlay";
import {
	ZCalendarDragData,
	ZDayCellOverData,
	ZTimeBlockOverData,
} from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/dnd-schemas";
import {
	moveEventToAllDay,
	moveEventToDay,
} from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/droppable-day-cell";
import {
	moveEventToSlot,
	resizeEventToSlot,
} from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/droppable-time-block";
import { useUpdateEventMutation } from "@/routes/_authenticated/calendar/-components/calendar/hooks/use-update-event-mutation";
import type { DragEndEvent, DragStartEvent, Modifier } from "@dnd-kit/core";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { parseISO } from "date-fns";
import { toast } from "sonner";

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

	const onDragStart = (event: DragStartEvent) => {
		const activeData = ZCalendarDragData.safeParse(
			event.active.data.current,
		).data;
		const isLocked = activeData?.event.isEditable === false;

		if (isLocked) {
			toast.error(`You cannot move this event!`, {
				duration: 3000,
			});
		}
	};

	const onDragEnd = (event: DragEndEvent) => {
		const activeResult = ZCalendarDragData.safeParse(event.active.data.current);
		const overResult = ZDayCellOverData.safeParse(event.over?.data.current);
		const activeData = activeResult.success ? activeResult.data : undefined;
		const overData = overResult.success ? overResult.data : undefined;

		if (!activeData || !activeData.event?.convexId) {
			return;
		}
		// Don't proceed if event is locked
		if (activeData.event.isEditable === false) {
			return;
		}
		if (!event.over || !overData) {
			return;
		}
		if (activeData.type === "event") {
			// Check if recurring event needs dialog
			if (activeData.event.recurringEventId) {
				dialogStore.send({
					type: "openRecurringEventDialog",
					onConfirm: (mode) => {
						moveEventToDay(
							activeData.event,
							overData.cell.date,
							mutateAsync,
							mode,
						);
					},
					onCancel: () => {},
				});
				return;
			}
			// Not recurring, proceed directly
			moveEventToDay(activeData.event, overData.cell.date, mutateAsync);
		}
	};

	return (
		<DndContext
			id={DND_CONTEXT_ID_MONTH}
			sensors={sensors}
			onDragStart={onDragStart}
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
	view: "day" | "week" | "2day";
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
	// 2day and week: allow horizontal drag (between days). day: vertical only.
	const modifiers = view === "day" ? [restrictToVerticalAxis] : undefined;

	const onDragStart = (event: DragStartEvent) => {
		const activeData = ZCalendarDragData.safeParse(
			event.active.data.current,
		).data;

		if (activeData?.event.isEditable === false) {
			toast.error(`You cannot move this event!`, {
				duration: 3000,
			});
		}
	};

	const onDragEnd = (event: DragEndEvent) => {
		const activeResult = ZCalendarDragData.safeParse(event.active.data.current);
		const activeData = activeResult.success ? activeResult.data : undefined;

		if (!activeData || !activeData.event.convexId) {
			return;
		}
		// Don't proceed if event is locked
		if (activeData.event.isEditable === false) {
			return;
		}
		if (!event.over) {
			return;
		}

		const dayCellOverResult = ZDayCellOverData.safeParse(
			event.over.data.current,
		);
		if (dayCellOverResult.success && activeData.type === "event") {
			// Check if recurring event needs dialog
			if (activeData.event.recurringEventId) {
				dialogStore.send({
					type: "openRecurringEventDialog",
					onConfirm: (mode) => {
						moveEventToAllDay(
							activeData.event,
							dayCellOverResult.data.cell.date,
							mutateAsync,
							mode,
						);
					},
					onCancel: () => {},
				});
				return;
			}
			// Not recurring, proceed directly
			moveEventToAllDay(
				activeData.event,
				dayCellOverResult.data.cell.date,
				mutateAsync,
			);
			return;
		}

		const overResult = ZTimeBlockOverData.safeParse(event.over.data.current);
		const overData = overResult.success ? overResult.data : undefined;
		if (!overData) {
			return;
		}

		const slotStartTimestamp = overData.slotStartTimestamp;
		if (activeData.type === "event-resize") {
			// Check if recurring event needs dialog
			if (activeData.event.recurringEventId) {
				dialogStore.send({
					type: "openRecurringEventDialog",
					onConfirm: (mode) => {
						resizeEventToSlot(
							activeData.event,
							activeData.edge,
							slotStartTimestamp,
							mutateAsync,
							mode,
						);
					},
					onCancel: () => {},
				});
				return;
			}
			// Not recurring, proceed directly
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
		// Check if recurring event needs dialog
		if (activeData.event.recurringEventId) {
			dialogStore.send({
				type: "openRecurringEventDialog",
				onConfirm: (mode) => {
					moveEventToSlot(
						activeData.event,
						slotStartTimestamp,
						mutateAsync,
						mode,
					);
				},
				onCancel: () => {},
			});
			return;
		}
		// Not recurring, proceed directly
		moveEventToSlot(activeData.event, slotStartTimestamp, mutateAsync);
	};

	return (
		<DndContext
			id={DND_CONTEXT_ID_DAY_WEEK}
			sensors={sensors}
			modifiers={modifiers}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
		>
			{children}
			<DragOverlay>
				<CalendarDragOverlayContent />
			</DragOverlay>
		</DndContext>
	);
}
