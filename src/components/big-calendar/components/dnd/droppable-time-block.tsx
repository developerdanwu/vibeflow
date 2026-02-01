"use client";

import { format, parseISO } from "date-fns";
import { useDrop } from "react-dnd";
import { ItemTypes } from "@/components/big-calendar/components/dnd/draggable-event";
import { useUpdateEvent } from "@/components/big-calendar/hooks/use-update-event";
import type { IEvent } from "@/components/big-calendar/interfaces";
import { cn } from "@/lib/utils";

interface DroppableTimeBlockProps {
	date: Date;
	hour: number;
	minute: number;
	children: React.ReactNode;
}

export function DroppableTimeBlock({
	date,
	hour,
	minute,
	children,
}: DroppableTimeBlockProps) {
	const { updateEvent } = useUpdateEvent();

	const [{ isOver, canDrop }, drop] = useDrop(
		() => ({
			accept: ItemTypes.EVENT,
			drop: (item: { event: IEvent }) => {
				const droppedEvent = item.event;

				if (!droppedEvent.convexId) return { moved: false };

				const eventStartDate = parseISO(droppedEvent.startDate);
				const eventEndDate = parseISO(droppedEvent.endDate);
				const eventDurationMs =
					eventEndDate.getTime() - eventStartDate.getTime();

				const newStartDate = new Date(date);
				newStartDate.setHours(hour, minute, 0, 0);
				const newEndDate = new Date(newStartDate.getTime() + eventDurationMs);

				const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

				updateEvent({
					id: droppedEvent.convexId,
					startDateStr: format(newStartDate, "yyyy-MM-dd"),
					startTime: format(newStartDate, "HH:mm"),
					endDateStr: format(newEndDate, "yyyy-MM-dd"),
					endTime: format(newEndDate, "HH:mm"),
					timeZone: droppedEvent.timeZone || browserTz,
					allDay: false,
				});

				return { moved: true };
			},
			collect: (monitor) => ({
				isOver: monitor.isOver(),
				canDrop: monitor.canDrop(),
			}),
		}),
		[date, hour, minute, updateEvent],
	);

	return (
		<div
			ref={drop as unknown as React.RefObject<HTMLDivElement>}
			className={cn("h-[24px]", isOver && canDrop && "bg-accent/50")}
		>
			{children}
		</div>
	);
}
