import {
	DraggableEvent,
	EventResizeHandle,
} from "@/components/big-calendar/components/dnd/draggable-event";
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
import { differenceInMinutes, format, parseISO } from "date-fns";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { type HTMLAttributes, useEffect } from "react";

export const calendarWeekEventCardVariants = cva(
	"flex cursor-pointer select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-2 text-xs transition-[filter] duration-150 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
				gray: "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 [&_.event-dot]:fill-neutral-600",

				// Dot variants
				"blue-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-blue-600",
				"green-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-green-600",
				"red-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-red-600",
				"orange-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-orange-600",
				"purple-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-purple-600",
				"yellow-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-yellow-600",
				"gray-dot":
					"bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-neutral-600",
			},
		},
		defaultVariants: {
			color: "blue-dot",
		},
	},
);

interface IProps
	extends HTMLAttributes<HTMLDivElement>,
		Omit<VariantProps<typeof calendarWeekEventCardVariants>, "color"> {
	event: TEvent;
	/** When provided, used for resize drag data so drop handler receives the real event (e.g. day view passes displayEvent for layout but original for API). */
	originalEvent?: TEvent;
	handle: NonNullable<PopoverRootProps["handle"]>;
}

export function EventBlock({
	event,
	className,
	handle,
	originalEvent,
}: IProps) {
	const [badgeVariant] = useCalendar((s) => s.context.badgeVariant);

	const start = parseISO(event.startDate);
	const end = parseISO(event.endDate);
	const durationInMinutes = differenceInMinutes(end, start);
	/** Min height = one 15-min slot (one line of text). Hour slot is 96px. */
	const MIN_EVENT_HEIGHT_PX = (15 / 60) * 96;
	const heightInPixels = Math.max(
		MIN_EVENT_HEIGHT_PX,
		(durationInMinutes / 60) * 96 - 8,
	);
	const isSingleLine = (durationInMinutes / 60) * 96 - 8 <= MIN_EVENT_HEIGHT_PX;

	const heightMotionValue = useMotionValue(heightInPixels);
	const heightPx = useTransform(heightMotionValue, (v) => `${v}px`);
	useEffect(() => {
		if (heightMotionValue.get() !== heightInPixels) {
			animate(heightMotionValue, heightInPixels, {
				duration: 0.08,
				ease: "linear",
			});
		}
	}, [heightInPixels, heightMotionValue]);

	const color = (
		badgeVariant === "dot" ? `${event.color}-dot` : event.color
	) as VariantProps<typeof calendarWeekEventCardVariants>["color"];

	const calendarWeekEventCardClasses = cn(
		calendarWeekEventCardVariants({ color, className }),
		"justify-start",
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
		}
	};

	const timeStr =
		durationInMinutes > 0
			? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
			: format(start, "h:mm a");

	const showResizeHandles = !event.allDay;
	const resizeHandleClass =
		"shrink-0 w-full cursor-ns-resize border-0 bg-transparent";

	const tooltipTimeStr = event.allDay
		? undefined
		: durationInMinutes > 0
			? `${start.getMinutes() === 0 ? format(start, "h a") : format(start, "h:mm")} - ${end.getMinutes() === 0 ? format(end, "h a") : format(end, "h:mm a")}`
			: format(start, "h:mm a");

	return (
		<DraggableEvent event={event}>
			<Tooltip>
				<TooltipTrigger
					render={
						<PopoverTrigger
							handle={handle}
							id={`day-event-${event.id}`}
							payload={{
								date: parseISO(event.startDate),
								mode: "edit",
								event,
							}}
							render={
								<motion.button
									initial={false}
									className={cn(
										calendarWeekEventCardClasses,
										showResizeHandles &&
											"relative flex w-full flex-col items-start rounded-md",
									)}
									style={{ height: heightPx }}
									tabIndex={0}
									onKeyDown={handleKeyDown}
									onClick={(e) => e.stopPropagation()}
								/>
							}
						/>
					}
				>
					<EventResizeHandle
						event={event}
						edge="top"
						originalEvent={originalEvent}
					>
						<button
							type="button"
							className={cn(
								"absolute top-0 right-0 left-0 h-1 rounded-t-md",
								resizeHandleClass,
							)}
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
							aria-label="Resize event start"
						/>
					</EventResizeHandle>
					<div className="flex min-h-0 flex-1 flex-col justify-start">
						{isSingleLine ? (
							<div className="flex min-w-0 items-center justify-between gap-2">
								<div className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
									{["mixed", "dot"].includes(badgeVariant) && (
										<svg
											width="8"
											height="8"
											viewBox="0 0 8 8"
											className="event-dot shrink-0"
											aria-hidden
										>
											<title>Event color</title>
											<circle cx="4" cy="4" r="4" />
										</svg>
									)}
									<p className="truncate font-semibold">
										{event.title || "Untitled"}
									</p>
								</div>
								{!event.allDay && (
									<span className="shrink-0 text-xs opacity-90">{timeStr}</span>
								)}
							</div>
						) : (
							<>
								<div className="flex items-center gap-1.5 truncate">
									{["mixed", "dot"].includes(badgeVariant) && (
										<svg
											width="8"
											height="8"
											viewBox="0 0 8 8"
											className="event-dot shrink-0"
											aria-hidden
										>
											<title>Event color</title>
											<circle cx="4" cy="4" r="4" />
										</svg>
									)}
									<p className="truncate text-left font-semibold">
										{event.title || "Untitled"}
									</p>
								</div>
								{!event.allDay && durationInMinutes > 25 && <p>{timeStr}</p>}
							</>
						)}
					</div>
					<EventResizeHandle
						event={event}
						edge="bottom"
						originalEvent={originalEvent}
					>
						<button
							type="button"
							className={cn(
								"absolute right-0 bottom-0 left-0 h-1 rounded-b-md",
								resizeHandleClass,
							)}
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
							aria-label="Resize event end"
						/>
					</EventResizeHandle>
				</TooltipTrigger>
				<TooltipContent side="top" className="max-w-xs px-3 py-2">
					<p className="font-semibold">{event.title || "Untitled"}</p>
					{tooltipTimeStr && (
						<p className="text-2xs opacity-70">{tooltipTimeStr}</p>
					)}
				</TooltipContent>
			</Tooltip>
		</DraggableEvent>
	);
}
