import { DraggableEvent } from "@/components/big-calendar/components/dnd/draggable-event";
import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { PopoverTrigger } from "@/components/ui/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PopoverRootProps } from "@base-ui/react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { endOfDay, format, isSameDay, parseISO, startOfDay } from "date-fns";

export const eventBadgeVariants = cva(
	"flex size-auto h-6.5 w-full select-none items-center justify-between gap-1.5 truncate whitespace-nowrap rounded-md border px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
	{
		variants: {
			color: {
				// Colored and mixed variants
				blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 [&_.event-dot]:fill-blue-600",
				green:
					"border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300 [&_.event-dot]:fill-green-600",
				red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 [&_.event-dot]:fill-red-600",
				yellow:
					"border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 [&_.event-dot]:fill-yellow-600",
				purple:
					"border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 [&_.event-dot]:fill-purple-600",
				orange:
					"border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 [&_.event-dot]:fill-orange-600",
				gray: "border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 [&_.event-dot]:fill-neutral-600",

				// Dot variants
				"blue-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-blue-600",
				"green-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-green-600",
				"red-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-red-600",
				"yellow-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-yellow-600",
				"purple-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-purple-600",
				"orange-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-orange-600",
				"gray-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-neutral-600",
			},
			multiDayPosition: {
				first:
					"relative z-10 mr-0 w-[calc(100%_-_3px)] rounded-r-none border-r-0 [&>span]:mr-2.5",
				middle:
					"relative z-10 mx-0 w-[calc(100%_+_1px)] rounded-none border-x-0",
				last: "ml-0 rounded-l-none border-l-0",
				none: "",
			},
		},
		defaultVariants: {
			color: "blue-dot",
		},
	},
);

interface IProps
	extends Omit<
		VariantProps<typeof eventBadgeVariants>,
		"color" | "multiDayPosition"
	> {
	handle: NonNullable<PopoverRootProps["handle"]>;
	event: TEvent;
	cellDate: Date;
	eventCurrentDay?: number;
	eventTotalDays?: number;
	className?: string;
	position?: "first" | "middle" | "last" | "none";
}

export function MonthEventBadge({
	handle,
	event,
	cellDate,
	eventCurrentDay,
	eventTotalDays,
	className,
	position: propPosition,
}: IProps) {
	const [badgeVariant] = useCalendar((s) => s.context.badgeVariant);

	// Use Notion-style dates for all-day events, fallback to timestamp-based for timed events
	const itemStart = event.startDateStr
		? new Date(event.startDateStr + "T00:00:00")
		: startOfDay(parseISO(event.startDate));
	const itemEnd = event.endDateStr
		? new Date(event.endDateStr + "T00:00:00")
		: endOfDay(parseISO(event.endDate));

	let position: "first" | "middle" | "last" | "none" | undefined;

	if (propPosition) {
		position = propPosition;
	} else if (eventCurrentDay && eventTotalDays) {
		position = "none";
	} else if (isSameDay(itemStart, itemEnd)) {
		position = "none";
	} else if (isSameDay(cellDate, itemStart)) {
		position = "first";
	} else if (isSameDay(cellDate, itemEnd)) {
		position = "last";
	} else {
		position = "middle";
	}

	const renderBadgeText = ["first", "none"].includes(position);

	const color = (
		badgeVariant === "dot" ? `${event.color}-dot` : event.color
	) as VariantProps<typeof eventBadgeVariants>["color"];

	const eventBadgeClasses = cn(eventBadgeVariants({ color, className }));

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
		}
	};

	const start = parseISO(event.startDate);
	const end = parseISO(event.endDate);
	const startStr =
		start.getMinutes() === 0 ? format(start, "h a") : format(start, "h:mm");
	const endStr =
		end.getMinutes() === 0 ? format(end, "h a") : format(end, "h:mm a");
	const timeRange = `${startStr} - ${endStr}`;

	const triggerId = `event-badge-${event.id}`;

	return (
		<DraggableEvent event={event} sourceView="month">
			<PopoverTrigger
				handle={handle}
				id={triggerId}
				payload={{
					date: parseISO(event.startDate),
					mode: "edit",
					event,
				}}
				render={({ className, onClick: onClickBadge, ...props }) => {
					return (
						<Tooltip>
							<TooltipTrigger
								render={({
									className: tooltipClassName,
									onClick: onClickTooltip,
									...tooltipProps
								}) => {
									return (
										<button
											type="button"
											tabIndex={0}
											className={cn(eventBadgeClasses, tooltipClassName)}
											onKeyDown={handleKeyDown}
											{...tooltipProps}
											{...props}
											onClick={(e) => {
												e.stopPropagation();
												onClickTooltip?.(e);
												onClickBadge?.(e);
											}}
										>
											<div className="flex items-center gap-1.5 truncate">
												{renderBadgeText && (
													<p className="flex-1 truncate font-semibold">
														{eventCurrentDay && (
															<span className="text-xs">
																Day {eventCurrentDay} of {eventTotalDays} •{" "}
															</span>
														)}
														{event.title}
													</p>
												)}
											</div>

											{renderBadgeText && !event.allDay && (
												<span>{format(start, "h:mm a")}</span>
											)}
										</button>
									);
								}}
							/>
							<TooltipContent
								side="top"
								className="max-w-xs border bg-popover px-3 py-2 text-popover-foreground shadow-md"
							>
								<p className="font-semibold">{event.title}</p>
								{!event.allDay && (
									<p className="text-2xs text-muted-foreground">{timeRange}</p>
								)}
							</TooltipContent>
						</Tooltip>
					);
				}}
			/>
		</DraggableEvent>
	);
}
