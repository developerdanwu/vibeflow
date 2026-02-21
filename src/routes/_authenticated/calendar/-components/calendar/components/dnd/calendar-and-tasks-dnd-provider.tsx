import { getConvexErrorMessage } from "@/lib/convex-error";
import { dialogStore } from "@/lib/dialog-store";
import { CalendarDragOverlayContent } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/calendar-drag-overlay";
import {
	DEFAULT_TASK_DURATION_MS,
	DEFAULT_TASK_END_HOUR,
	DEFAULT_TASK_START_HOUR,
	DND_CONTEXT_ID_UNIFIED,
} from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/dnd-constants";
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
import { useCreateEventMutation } from "@/routes/_authenticated/calendar/-components/calendar/hooks/use-create-event-mutation";
import { useUpdateEventMutation } from "@/routes/_authenticated/calendar/-components/calendar/hooks/use-update-event-mutation";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useQuery } from "@tanstack/react-query";
import { addMilliseconds, parseISO, set, startOfDay } from "date-fns";
import { toast } from "sonner";

interface CalendarAndTasksDndProviderProps {
	children: React.ReactNode;
	view: "calendar" | "agenda";
	dayRange: string;
}

/**
 * Single DndContext wrapping both task sidebar and calendar so tasks can be
 * dragged onto the calendar to schedule. Handles task (create event) and
 * event (move/resize) drags.
 */
export function CalendarAndTasksDndProvider({
	children,
	view,
	dayRange,
}: CalendarAndTasksDndProviderProps) {
	const { mutateAsync: updateEvent } = useUpdateEventMutation({
		meta: { updateType: "drag" },
	});
	const { mutateAsync: createEvent } = useCreateEventMutation();
	const { data: calendars } = useQuery(
		convexQuery(api.calendars.queries.getAllUserCalendars),
	);
	const defaultCalendar = calendars?.find((cal) => cal.isDefault);
	/** Use default calendar, or first calendar if none is default (e.g. new user). */
	const calendarToUse = defaultCalendar ?? calendars?.[0];

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
	);
	const isMonthView = view === "calendar" && dayRange === "M";

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

		if (!activeData) {
			return;
		}

		// Task drop: create a new task event at the drop target
		if (activeData.type === "task") {
			console.log("[DnD task drop]", {
				overId: event.over?.id,
				overData: event.over?.data?.current,
				hasDefaultCalendar: !!defaultCalendar,
				defaultCalendarId: defaultCalendar?.id,
			});
			if (!event.over || !calendarToUse) {
				console.warn("[DnD task drop] Aborting: no drop target or no calendar");
				return;
			}
			const { taskItem } = activeData;
			const dayCellResult = ZDayCellOverData.safeParse(event.over.data.current);
			const timeBlockResult = ZTimeBlockOverData.safeParse(
				event.over.data.current,
			);
			console.log("[DnD task drop] Parse results", {
				dayCellOk: dayCellResult.success,
				dayCellError: dayCellResult.success
					? undefined
					: dayCellResult.error?.message,
				timeBlockOk: timeBlockResult.success,
				timeBlockError: timeBlockResult.success
					? undefined
					: timeBlockResult.error?.message,
			});

			if (dayCellResult.success) {
				const cellDate = dayCellResult.data.cell.date;
				const startDateTime = set(startOfDay(cellDate), {
					hours: DEFAULT_TASK_START_HOUR,
					minutes: 0,
					seconds: 0,
					milliseconds: 0,
				});
				const endDateTime = set(startOfDay(cellDate), {
					hours: DEFAULT_TASK_END_HOUR,
					minutes: 0,
					seconds: 0,
					milliseconds: 0,
				});
				console.log("[DnD task drop] Creating event on day cell", {
					cellDate: dayCellResult.data.cell.date,
					start: startDateTime.getTime(),
					end: endDateTime.getTime(),
				});
				createEvent({
					title: taskItem.title,
					description: "",
					allDay: false,
					startTimestamp: startDateTime.getTime(),
					endTimestamp: endDateTime.getTime(),
					calendarId: calendarToUse.id,
					eventKind: "task",
					scheduledTaskLinks: [
						{ externalTaskId: taskItem.externalTaskId, url: taskItem.url },
					],
				})
					.then(() =>
						console.log("[DnD task drop] createEvent (day cell) succeeded"),
					)
					.catch((err) => {
						console.error("[DnD task drop] createEvent (day cell) failed", err);
						toast.error(getConvexErrorMessage(err, "Failed to schedule task"));
					});
				return;
			}

			if (timeBlockResult.success) {
				const slotStart = timeBlockResult.data.slotStartTimestamp;
				const endTimestamp = addMilliseconds(
					slotStart,
					DEFAULT_TASK_DURATION_MS,
				).getTime();
				console.log("[DnD task drop] Creating event on time block", {
					slotStart,
					endTimestamp,
				});
				createEvent({
					title: taskItem.title,
					description: "",
					allDay: false,
					startTimestamp: slotStart,
					endTimestamp,
					calendarId: calendarToUse.id,
					eventKind: "task",
					scheduledTaskLinks: [
						{ externalTaskId: taskItem.externalTaskId, url: taskItem.url },
					],
				})
					.then(() =>
						console.log("[DnD task drop] createEvent (time block) succeeded"),
					)
					.catch((err) => {
						console.error(
							"[DnD task drop] createEvent (time block) failed",
							err,
						);
						toast.error(getConvexErrorMessage(err, "Failed to schedule task"));
					});
				return;
			}
			console.warn(
				"[DnD task drop] Drop target was neither day-cell nor time-block",
			);
			return;
		}

		// Event drag: move or resize (same logic as MonthDndProvider / DayWeekDndProvider)
		if (!activeData.event?.convexId || activeData.event.isEditable === false) {
			return;
		}
		if (!event.over) {
			return;
		}

		const dayCellOverResult = ZDayCellOverData.safeParse(
			event.over.data.current,
		);
		if (dayCellOverResult.success && activeData.type === "event") {
			if (activeData.event.recurringEventId) {
				dialogStore.send({
					type: "openRecurringEventDialog",
					onConfirm: (mode) => {
						isMonthView
							? moveEventToDay(
									activeData.event,
									dayCellOverResult.data.cell.date,
									updateEvent,
									mode,
								)
							: moveEventToAllDay(
									activeData.event,
									dayCellOverResult.data.cell.date,
									updateEvent,
									mode,
								);
					},
					onCancel: () => {},
				});
				return;
			}
			isMonthView
				? moveEventToDay(
						activeData.event,
						dayCellOverResult.data.cell.date,
						updateEvent,
					)
				: moveEventToAllDay(
						activeData.event,
						dayCellOverResult.data.cell.date,
						updateEvent,
					);
			return;
		}

		const timeBlockOverResult = ZTimeBlockOverData.safeParse(
			event.over.data.current,
		);
		const overData = timeBlockOverResult.success
			? timeBlockOverResult.data
			: undefined;
		if (!overData) {
			return;
		}

		const slotStartTimestamp = overData.slotStartTimestamp;
		if (activeData.type === "event-resize") {
			if (activeData.event.recurringEventId) {
				dialogStore.send({
					type: "openRecurringEventDialog",
					onConfirm: (mode) => {
						resizeEventToSlot(
							activeData.event,
							activeData.edge,
							slotStartTimestamp,
							updateEvent,
							mode,
						);
					},
					onCancel: () => {},
				});
				return;
			}
			resizeEventToSlot(
				activeData.event,
				activeData.edge,
				slotStartTimestamp,
				updateEvent,
			);
			return;
		}

		if (activeData.type === "event") {
			const currentStart = parseISO(activeData.event.startDate).getTime();
			if (currentStart === slotStartTimestamp) {
				return;
			}
			if (activeData.event.recurringEventId) {
				dialogStore.send({
					type: "openRecurringEventDialog",
					onConfirm: (mode) => {
						moveEventToSlot(
							activeData.event,
							slotStartTimestamp,
							updateEvent,
							mode,
						);
					},
					onCancel: () => {},
				});
				return;
			}
			moveEventToSlot(activeData.event, slotStartTimestamp, updateEvent);
		}
	};

	return (
		<DndContext
			id={DND_CONTEXT_ID_UNIFIED}
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
