import { DroppableDayCell } from "@/components/big-calendar/components/dnd/droppable-day-cell";
import {
	eventBadgeVariants,
	MonthEventBadge,
} from "@/components/big-calendar/components/month-view/month-event-badge";
import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import {
	getMonthCellEvents,
	isEventOnDate,
} from "@/components/big-calendar/helpers";
import type {
	ICalendarCell,
	TEvent,
} from "@/components/big-calendar/interfaces";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PopoverRootProps } from "@base-ui/react/popover";
import type { VariantProps } from "class-variance-authority";
import { format, isToday, startOfDay } from "date-fns";
import { useMemo } from "react";

interface IProps {
	cell: ICalendarCell;
	events: TEvent[];
	eventPositions: Record<string, number>;
	handle: NonNullable<PopoverRootProps["handle"]>;
}

const MAX_VISIBLE_EVENTS = 3;

export function DayCell({ cell, events, eventPositions, handle }: IProps) {
	const { day, currentMonth, date } = cell;
	const [badgeVariant] = useCalendar((s) => s.context.badgeVariant);
	const [newEventTitle] = useCalendar((s) => s.context.newEventTitle);
	const [newEventStartTime] = useCalendar((s) => s.context.newEventStartTime);
	const [newEventAllDay] = useCalendar((s) => s.context.newEventAllDay);
	const cellEvents = useMemo(
		() => getMonthCellEvents(date, events, eventPositions),
		[date, events, eventPositions],
	);
	if (cellEvents.length > 0) {
		console.log("cellEvents::", cellEvents);
	}
	const formattedStartTime = useMemo(() => {
		if (!newEventStartTime) return null;

		return format(
			new Date(1970, 0, 1, newEventStartTime.hour, newEventStartTime.minute),
			"h:mm a",
		);
	}, [newEventStartTime]);

	const isOpen = handle.store.useState("open");
	const activeTriggerId = handle.store.useState("activeTriggerId");
	const triggerId = `quick-add-event-${date.toISOString()}`;
	const isSunday = date.getDay() === 0;

	const addEventColor = (
		badgeVariant === "dot" ? "gray-dot" : "gray"
	) as VariantProps<typeof eventBadgeVariants>["color"];

	return (
		<DroppableDayCell
			cell={cell}
			onClick={() => {
				handle.open(triggerId);
			}}
			className="relative"
		>
			<div
				className={cn(
					"flex h-full flex-col gap-1 border-t border-l py-1.5 pt-1 pb-2",
					isSunday && "border-l-0",
				)}
			>
				<span
					className={cn(
						"flex size-6 translate-x-1 items-center justify-center rounded-full px-2 font-semibold text-xs hover:bg-accent",
						!currentMonth && "opacity-20",
						isToday(date) &&
							"bg-primary font-bold text-primary-foreground hover:bg-primary",
					)}
				>
					{day}
				</span>

				<div
					className={cn(
						"relative flex flex-1 flex-col space-y-2 px-2",
						!currentMonth && "opacity-50",
					)}
				>
					<PopoverTrigger
						handle={handle}
						id={triggerId}
						payload={{ mode: "create", startDate: date }}
						render={({ className, onClick, ...props }) => {
							return (
								<button
									type="button"
									className={cn(
										eventBadgeVariants({
											color: addEventColor,
										}),
										"invisible absolute top-0 flex h-0 w-full",
										isOpen &&
											activeTriggerId === triggerId &&
											"visible relative h-auto min-h-6",
										className,
									)}
									onClick={(e) => {
										e.stopPropagation();
										onClick?.(e);
									}}
									{...props}
								>
									<div className="flex w-full items-center justify-between gap-1.5 truncate">
										<p className="truncate font-semibold">
											{newEventTitle || "(No title)"}
										</p>
										{!newEventAllDay && newEventStartTime ? (
											<p>{formattedStartTime}</p>
										) : null}
									</div>
								</button>
							);
						}}
					/>
					{Array.from({ length: MAX_VISIBLE_EVENTS }).map((_, position) => {
						const event = cellEvents.find((e) => e.position === position);
						const eventKey = event
							? `event-${event.id}-${position}`
							: `empty-${position}`;
						const cellDate = startOfDay(date);

						// Use helper to check if event should display on this calendar day
						if (!event || !isEventOnDate(event, cellDate)) {
							return null;
						}

						return (
							<div key={eventKey} className="w-full">
								{event && (
									<MonthEventBadge
										handle={handle}
										className="flex"
										event={event}
										cellDate={cellDate}
									/>
								)}
							</div>
						);
					})}
				</div>

				<p
					className={cn(
						"h-4.5 px-1.5 font-semibold text-muted-foreground text-xs",
						!currentMonth && "opacity-50",
						cellEvents.length <= MAX_VISIBLE_EVENTS && "invisible",
					)}
				>
					<span className="sm:hidden">
						+{cellEvents.length - MAX_VISIBLE_EVENTS}
					</span>
					<span className="hidden sm:inline">
						{" "}
						{cellEvents.length - MAX_VISIBLE_EVENTS} more...
					</span>
				</p>
			</div>
		</DroppableDayCell>
	);
}
