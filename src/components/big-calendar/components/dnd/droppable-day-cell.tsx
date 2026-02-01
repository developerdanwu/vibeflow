"use client";

import { addDays, differenceInDays, format, parseISO } from "date-fns";
import type { HTMLAttributes } from "react";
import { useDrop } from "react-dnd";
import { ItemTypes } from "@/components/big-calendar/components/dnd/draggable-event";
import { useUpdateEvent } from "@/components/big-calendar/hooks/use-update-event";
import type {
	ICalendarCell,
	IEvent,
} from "@/components/big-calendar/interfaces";
import { cn } from "@/lib/utils";

interface DroppableDayCellProps extends HTMLAttributes<HTMLDivElement> {
	cell: ICalendarCell;
}

export function DroppableDayCell({
	cell,
	className,
	...props
}: DroppableDayCellProps) {
	const { updateEvent } = useUpdateEvent();

	const [{ isOver, canDrop }, drop] = useDrop(
		() => ({
			accept: ItemTypes.EVENT,
			drop: (item: { event: IEvent }) => {
				const droppedEvent = item.event;

				if (!droppedEvent.convexId) return { moved: false };

				const eventStartDate = parseISO(droppedEvent.startDate);
				const eventEndDate = parseISO(droppedEvent.endDate);

				const newStartDate = new Date(cell.date);
				newStartDate.setHours(
					eventStartDate.getHours(),
					eventStartDate.getMinutes(),
					eventStartDate.getSeconds(),
					eventStartDate.getMilliseconds(),
				);
				const daysDiff = differenceInDays(newStartDate, eventStartDate);

				updateEvent({
					id: droppedEvent.convexId,
					startDateStr: format(newStartDate, "yyyy-MM-dd"),
					endDateStr: format(addDays(eventEndDate, daysDiff), "yyyy-MM-dd"),
					...(droppedEvent.startTime && {
						startTime: droppedEvent.startTime,
					}),
					...(droppedEvent.endTime && { endTime: droppedEvent.endTime }),
					...(droppedEvent.timeZone && { timeZone: droppedEvent.timeZone }),
				});

				return { moved: true };
			},
			collect: (monitor) => ({
				isOver: monitor.isOver(),
				canDrop: monitor.canDrop(),
			}),
		}),
		[cell.date, updateEvent],
	);

	return (
		<div
			ref={drop as unknown as React.RefObject<HTMLDivElement>}
			className={cn("h-full", isOver && canDrop && "bg-accent/50", className)}
			{...props}
		></div>
	);
}
