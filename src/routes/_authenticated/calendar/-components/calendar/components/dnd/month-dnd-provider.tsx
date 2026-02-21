import { dialogStore } from "@/lib/dialog-store";
import { CalendarDragOverlayContent } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/calendar-drag-overlay";
import { DND_CONTEXT_ID_MONTH } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/dnd-constants";
import {
	ZCalendarDragData,
	ZDayCellOverData,
} from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/dnd-schemas";
import { moveEventToDay } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/droppable-day-cell";
import { useUpdateEventMutation } from "@/routes/_authenticated/calendar/-components/calendar/hooks/use-update-event-mutation";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { toast } from "sonner";

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
		const isLocked =
			activeData &&
			"event" in activeData &&
			activeData.event.isEditable === false;

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

		if (!activeData || activeData.type === "task") {
			return;
		}
		if (!activeData.event?.convexId) {
			return;
		}
		if (activeData.event.isEditable === false) {
			return;
		}
		if (!event.over || !overData) {
			return;
		}
		if (activeData.type === "event") {
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
			moveEventToDay(activeData.event, overData.cell.date, mutateAsync);
		}
	};

	return (
		<DndContext
			id={DND_CONTEXT_ID_MONTH}
			sensors={sensors}
			modifiers={[restrictToWindowEdges]}
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
