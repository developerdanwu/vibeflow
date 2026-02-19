import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
	ZCalendarDragData,
	ZTimeBlockOverData,
} from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/dnd-schemas";
import { DropRangeRing } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/drop-range-ring";
import { DroppableTimeBlock } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/droppable-time-block";
import type { TEventPopoverFormData } from "@/routes/_authenticated/calendar/-components/event-popover/event-popover";
import { ZEventPopoverForm } from "@/routes/_authenticated/calendar/-components/event-popover/event-popover";
import { eventBadgeVariants } from "@/routes/_authenticated/calendar/-components/calendar/components/month-view/month-event-badge";
import { CalendarTimeline } from "@/routes/_authenticated/calendar/-components/calendar/components/week-and-day-view/calendar-time-line";
import { EventBlock } from "@/routes/_authenticated/calendar/-components/calendar/components/week-and-day-view/event-block";
import { useCalendar } from "@/routes/_authenticated/calendar/-components/calendar/contexts/calendar-context";
import {
	getEventBlockStyle,
	isWorkingHour,
} from "@/routes/_authenticated/calendar/-components/calendar/core/helpers";
import { useDragToCreate } from "@/routes/_authenticated/calendar/-components/calendar/hooks/use-drag-to-create";
import type { TEvent } from "@/routes/_authenticated/calendar/-components/calendar/core/interfaces";
import type { Popover as PopoverBase } from "@base-ui/react";
import { mergeProps } from "@base-ui/react";
import { useDndContext } from "@dnd-kit/core";
import { Time } from "@internationalized/date";
import type { VariantProps } from "class-variance-authority";
import { areIntervalsOverlapping, format, isToday, parseISO } from "date-fns";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

const MIN_DURATION_MS = 15 * 60 * 1000;

type TWorkingHours = { [key: number]: { from: number; to: number } };

export interface DayViewColumnProps {
	day: Date;
	triggerId: string;
	quickAddEventPopoverHandle: ReturnType<typeof PopoverBase.createHandle>;
	hours: number[];
	workingHours: TWorkingHours;
	earliestEventHour: number;
	latestEventHour: number;
	groupedEvents: TEvent[][];
}

export function DayViewColumn({
	day,
	triggerId,
	quickAddEventPopoverHandle,
	hours,
	workingHours,
	earliestEventHour,
	latestEventHour,
	groupedEvents,
}: DayViewColumnProps) {
	const { active, over } = useDndContext();
	const activeResult = ZCalendarDragData.safeParse(active?.data.current);
	const activeData = activeResult.success ? activeResult.data : undefined;
	const overResult = ZTimeBlockOverData.safeParse(over?.data?.current);
	const overData = overResult.success ? overResult.data : undefined;
	const resizingEventId =
		activeData && activeData.type === "event-resize"
			? activeData.event.id
			: null;

	const gridRef = useRef<HTMLDivElement>(null);
	const [workingHoursContext] = useCalendar((s) => s.context.workingHours);
	const [badgeVariant] = useCalendar((s) => s.context.badgeVariant);
	const [newEventTitle] = useCalendar((s) => s.context.newEventTitle);
	const [newEventDescription] = useCalendar(
		(s) => s.context.newEventDescription,
	);
	const [newEventStartTime] = useCalendar((s) => s.context.newEventStartTime);
	const [, calendarStore] = useCalendar();
	const [newEventEndTime] = useCalendar((s) => s.context.newEventEndTime);

	const activeTriggerId =
		quickAddEventPopoverHandle.store.useState("activeTriggerId");

	const dragToCreate = useDragToCreate({
		gridRef,
		firstHour: hours[0],
		onDragEnd: (range) => {
			calendarStore.trigger.setNewEventStartTime({
				startTime: new Time(range.startSlot.hour, range.startSlot.minute),
			});
			calendarStore.trigger.setNewEventEndTime({
				endTime: new Time(range.endSlot.hour, range.endSlot.minute, 0),
			});
			quickAddEventPopoverHandle.open(triggerId);
		},
		onClick: (slot) => {
			calendarStore.trigger.setNewEventStartTime({
				startTime: new Time(slot.hour, slot.minute),
			});
			const endM = slot.minute + 15;
			const endHour = endM >= 60 ? slot.hour + 1 : slot.hour;
			const endMin = endM >= 60 ? 0 : endM;
			calendarStore.trigger.setNewEventEndTime({
				endTime: new Time(endHour, endMin, 0),
			});
			quickAddEventPopoverHandle.open(triggerId);
		},
	});

	const newEventTime = newEventStartTime
		? { hour: newEventStartTime.hour, minute: newEventStartTime.minute }
		: { hour: 0, minute: 0 };
	const newEventEndTimeVal = newEventEndTime
		? { hour: newEventEndTime.hour, minute: newEventEndTime.minute }
		: { hour: newEventTime.hour + 1, minute: newEventTime.minute };

	const isThisColumnTriggerActive = activeTriggerId === triggerId;
	const showNewEventBlock =
		!!(
			dragToCreate.dragPreview ||
			(isThisColumnTriggerActive && newEventStartTime && newEventEndTime)
		) || isThisColumnTriggerActive;

	useEffect(() => {
		if (!showNewEventBlock) {
			dragToCreate.topValue.set(0);
			dragToCreate.heightValue.set(0);
		}
	}, [showNewEventBlock, dragToCreate.topValue, dragToCreate.heightValue]);

	const displayTimeRange = useMemo(() => {
		if (dragToCreate.dragPreview) {
			const { startSlot, endSlot } = dragToCreate.dragPreview;
			return `${format(new Date(1970, 0, 1, startSlot.hour, startSlot.minute), "h:mm a")} – ${format(new Date(1970, 0, 1, endSlot.hour, endSlot.minute), "h:mm a")}`;
		}
		if (newEventStartTime && newEventEndTime) {
			return `${format(new Date(1970, 0, 1, newEventStartTime.hour, newEventStartTime.minute), "h:mm a")} – ${format(new Date(1970, 0, 1, newEventEndTime.hour, newEventEndTime.minute), "h:mm a")}`;
		}
		return newEventStartTime
			? format(
					new Date(
						1970,
						0,
						1,
						newEventStartTime.hour,
						newEventStartTime.minute,
					),
					"h:mm a",
				)
			: null;
	}, [dragToCreate.dragPreview, newEventStartTime, newEventEndTime]);

	const newEventPayload = useMemo(
		() =>
			ZEventPopoverForm.parse({
				mode: "create",
				startDate: day,
				allDay: false,
				startTime: new Time(newEventTime.hour, newEventTime.minute),
				endTime: new Time(
					newEventEndTimeVal.hour,
					newEventEndTimeVal.minute,
					0,
				),
				title: newEventTitle,
				description: newEventDescription,
			} satisfies TEventPopoverFormData),
		[
			day,
			newEventTime.hour,
			newEventTime.minute,
			newEventEndTimeVal.hour,
			newEventEndTimeVal.minute,
			newEventTitle,
			newEventDescription,
		],
	);

	const addEventColor = (
		badgeVariant === "dot" ? "gray-dot" : "gray"
	) as VariantProps<typeof eventBadgeVariants>["color"];

	const effectiveWorkingHours = workingHours ?? workingHoursContext;

	return (
		<div className="relative flex-1 border-l">
			<div ref={gridRef} className="relative">
				<DropRangeRing day={day} firstHour={hours[0]} />
				{hours.map((hour, index) => {
					const isDisabled = !isWorkingHour(day, hour, effectiveWorkingHours);
					return (
						<div
							key={hour}
							className={cn(
								"relative",
								isDisabled && "bg-calendar-disabled-hour",
							)}
							style={{ height: "96px" }}
						>
							{index !== 0 && (
								<div className="absolute inset-x-0 top-0 border-b" />
							)}
							<DroppableTimeBlock date={day} hour={hour} minute={0}>
								<button
									type="button"
									className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent"
									{...dragToCreate.getSlotProps(hour, 0)}
								/>
							</DroppableTimeBlock>
							<DroppableTimeBlock date={day} hour={hour} minute={15}>
								<button
									type="button"
									className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-accent"
									{...dragToCreate.getSlotProps(hour, 15)}
								/>
							</DroppableTimeBlock>
							<div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
							<DroppableTimeBlock date={day} hour={hour} minute={30}>
								<button
									type="button"
									className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent"
									{...dragToCreate.getSlotProps(hour, 30)}
								/>
							</DroppableTimeBlock>
							<DroppableTimeBlock date={day} hour={hour} minute={45}>
								<button
									type="button"
									className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent"
									{...dragToCreate.getSlotProps(hour, 45)}
								/>
							</DroppableTimeBlock>
						</div>
					);
				})}
				<motion.div
					className={cn(
						"pointer-events-none absolute inset-x-0",
						showNewEventBlock ? "z-50" : "invisible",
					)}
					style={{
						top: dragToCreate.topValue,
						height: dragToCreate.heightValue,
					}}
				>
					<PopoverTrigger
						handle={quickAddEventPopoverHandle}
						id={triggerId}
						payload={newEventPayload}
						render={(triggerProps) => (
							<button
								{...mergeProps(triggerProps, {
									className: cn(
										showNewEventBlock &&
											eventBadgeVariants({ color: addEventColor }),
										"relative z-10 h-full w-full rounded-md",
										showNewEventBlock &&
											"pointer-events-auto min-h-6 cursor-pointer hover:bg-accent",
										!showNewEventBlock && "pointer-events-none invisible",
									),
								})}
							>
								{showNewEventBlock ? (
									<div className="flex h-full w-full min-w-0 flex-col items-start justify-start gap-0.5 truncate px-1.5 py-1 text-xs">
										<p className="min-w-0 truncate font-semibold">
											{newEventTitle || "(No title)"}
										</p>
										{displayTimeRange ? (
											<p className="shrink-0 opacity-90">{displayTimeRange}</p>
										) : null}
									</div>
								) : null}
							</button>
						)}
					/>
				</motion.div>
				{groupedEvents.map((group, groupIndex) =>
					group.map((event) => {
						const isPreviewForThis =
							activeData?.type === "event-resize" &&
							activeData.event.id === event.id;
						const slotStartTimestamp = overData?.slotStartTimestamp;
						const displayEvent: TEvent = (() => {
							if (!isPreviewForThis || slotStartTimestamp == null) return event;
							if (activeData.edge === "bottom") {
								const startTs = parseISO(event.startDate).getTime();
								let endTs = slotStartTimestamp + MIN_DURATION_MS;
								if (endTs <= startTs || endTs - startTs < MIN_DURATION_MS)
									endTs = startTs + MIN_DURATION_MS;
								return {
									...event,
									endDate: new Date(endTs).toISOString(),
								};
							}
							const endTs = parseISO(event.endDate).getTime();
							let startTs = slotStartTimestamp;
							if (startTs >= endTs || endTs - startTs < MIN_DURATION_MS)
								startTs = endTs - MIN_DURATION_MS;
							return {
								...event,
								startDate: new Date(startTs).toISOString(),
							};
						})();
						let style = getEventBlockStyle(
							displayEvent,
							day,
							groupIndex,
							groupedEvents.length,
							{ from: earliestEventHour, to: latestEventHour },
						);
						const hasOverlap = groupedEvents.some(
							(otherGroup, otherIndex) =>
								otherIndex !== groupIndex &&
								otherGroup.some((otherEvent) =>
									areIntervalsOverlapping(
										{
											start: parseISO(event.startDate),
											end: parseISO(event.endDate),
										},
										{
											start: parseISO(otherEvent.startDate),
											end: parseISO(otherEvent.endDate),
										},
									),
								),
						);
						if (!hasOverlap) {
							style = { ...style, width: "100%", left: "0%" };
						}
						const isResizingThis = resizingEventId === event.id;
						const isThisTheActiveEvent = activeData?.event?.id === event.id;
						const isOtherBeingDraggedOrResized =
							active != null && !isThisTheActiveEvent;
						const startMs = parseISO(event.startDate).getTime();
						const orderValue = (86400000 - (startMs % 86400000)) / 86400000;
						const zIndex = 10 + Math.min(39, Math.floor(orderValue * 40));
						return (
							<div
								key={event.id}
								className="absolute p-1"
								style={{
									...style,
									zIndex,
									pointerEvents:
										isResizingThis || isOtherBeingDraggedOrResized
											? "none"
											: undefined,
								}}
							>
								<EventBlock
									event={displayEvent}
									originalEvent={event}
									handle={quickAddEventPopoverHandle}
								/>
							</div>
						);
					}),
				)}
			</div>
			{isToday(day) && (
				<CalendarTimeline
					firstVisibleHour={earliestEventHour}
					lastVisibleHour={latestEventHour}
				/>
			)}
		</div>
	);
}
