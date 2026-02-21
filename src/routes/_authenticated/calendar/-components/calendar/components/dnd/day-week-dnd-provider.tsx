import { dialogStore } from "@/lib/dialog-store";
import { CalendarDragOverlayContent } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/calendar-drag-overlay";
import { DND_CONTEXT_ID_DAY_WEEK } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/dnd-constants";
import {
	ZCalendarDragData,
	ZDayCellOverData,
	ZTimeBlockOverData,
} from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/dnd-schemas";
import { moveEventToAllDay } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/droppable-day-cell";
import {
	moveEventToSlot,
	resizeEventToSlot,
} from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/droppable-time-block";
import { useUpdateEventMutation } from "@/routes/_authenticated/calendar/-components/calendar/hooks/use-update-event-mutation";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	restrictToFirstScrollableAncestor,
	restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { parseISO } from "date-fns";
import { toast } from "sonner";

/** Run action; if event is recurring, show dialog and run action with user's choice. */
function withRecurringEventDialog(
	event: { recurringEventId?: string },
	action: (mode?: "this" | "all") => void,
) {
	if (event.recurringEventId) {
		dialogStore.send({
			type: "openRecurringEventDialog",
			onConfirm: action,
			onCancel: () => {},
		});
	} else {
		action();
	}
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
		const activeData = activeResult.success ? activeResult.data : undefined;

		if (!activeData || activeData.type === "task") {
			return;
		}
		if (!activeData.event.convexId) {
			return;
		}
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
			withRecurringEventDialog(activeData.event, (mode) =>
				moveEventToAllDay(
					activeData.event,
					dayCellOverResult.data.cell.date,
					mutateAsync,
					mode,
				),
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
			withRecurringEventDialog(activeData.event, (mode) =>
				resizeEventToSlot(
					activeData.event,
					activeData.edge,
					slotStartTimestamp,
					mutateAsync,
					mode,
				),
			);
			return;
		}
		const currentStart = parseISO(activeData.event.startDate).getTime();
		if (currentStart === slotStartTimestamp) {
			return;
		}
		withRecurringEventDialog(activeData.event, (mode) =>
			moveEventToSlot(activeData.event, slotStartTimestamp, mutateAsync, mode),
		);
	};

	return (
		<DndContext
			id={DND_CONTEXT_ID_DAY_WEEK}
			sensors={sensors}
			modifiers={[
				...(view === "day" ? [restrictToVerticalAxis] : []),
				restrictToFirstScrollableAncestor,
			]}
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
