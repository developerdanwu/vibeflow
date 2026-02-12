"use client";

import { ZCalendarDragData } from "@/components/big-calendar/components/dnd/dnd-schemas";
import { eventBadgeVariants } from "@/components/big-calendar/components/month-view/month-event-badge";
import { calendarWeekEventCardVariants } from "@/components/big-calendar/components/week-and-day-view/event-block";
import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { cn } from "@/lib/utils";
import { useDndContext } from "@dnd-kit/core";
import type { VariantProps } from "class-variance-authority";
import { differenceInMinutes, format, parseISO } from "date-fns";
import { useMemo } from "react";

const LINE_WIDTH = 120;

function ResizeLine() {
	return (
		<div
			style={{
				width: LINE_WIDTH,
				height: 2,
				backgroundColor: "hsl(var(--primary))",
				borderRadius: 1,
				cursor: "ns-resize",
			}}
		/>
	);
}

/** Min height = one 15-min slot. Hour slot is 96px. Matches event-block.tsx. */
const MIN_EVENT_HEIGHT_PX = (15 / 60) * 96;

/** Drag overlay preview that matches the in-place month event badge UI (rounded pill, same colors/layout). */
function MonthEventBadgePreview({
	event,
	width,
	height,
	badgeVariant,
}: {
	event: TEvent;
	width: number;
	height: number;
	badgeVariant: "colored" | "dot" | "mixed";
}) {
	const start = parseISO(event.startDate);
	const color = (
		badgeVariant === "dot" ? `${event.color}-dot` : event.color
	) as VariantProps<typeof eventBadgeVariants>["color"];
	const className = cn(
		eventBadgeVariants({ color, multiDayPosition: "none" }),
		"pointer-events-none",
	);
	return (
		<div
			className={className}
			style={{
				width: Math.max(width, 60),
				height: Math.max(height, 26),
				minHeight: 26,
			}}
		>
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
				<p className="flex-1 truncate font-semibold">
					{event.title || "Untitled"}
				</p>
				{!event.allDay && (
					<span className="shrink-0">{format(start, "h:mm a")}</span>
				)}
			</div>
		</div>
	);
}

function EventCardPreview({
	event,
	width,
	height,
	badgeVariant,
}: {
	event: TEvent;
	width: number;
	height: number;
	badgeVariant: "colored" | "dot" | "mixed";
}) {
	const start = parseISO(event.startDate);
	const end = parseISO(event.endDate);
	const durationInMinutes = differenceInMinutes(end, start);
	const timeStr =
		durationInMinutes > 0
			? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
			: format(start, "h:mm a");
	const isSingleLine = (durationInMinutes / 60) * 96 - 8 <= MIN_EVENT_HEIGHT_PX;

	const color = (
		badgeVariant === "dot" ? `${event.color}-dot` : event.color
	) as VariantProps<typeof calendarWeekEventCardVariants>["color"];

	const className = cn(
		calendarWeekEventCardVariants({ color }),
		"justify-start",
	);

	return (
		<div
			className={className}
			style={{
				width: Math.max(width, 80),
				height: Math.max(height, MIN_EVENT_HEIGHT_PX),
			}}
		>
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
						<span className="shrink-0 text-xs opacity-90">{timeStr}</span>
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
							<p className="truncate font-semibold">
								{event.title || "Untitled"}
							</p>
						</div>
						{durationInMinutes > 25 && <p>{timeStr}</p>}
					</>
				)}
			</div>
		</div>
	);
}

export function CalendarDragOverlayContent() {
	const { active, activeNodeRect } = useDndContext();
	const [badgeVariant] = useCalendar((s) => s.context.badgeVariant);
	const result = ZCalendarDragData.safeParse(active?.data.current);
	const data = result.success ? result.data : undefined;

	const overlay = useMemo(() => {
		if (!active || !data) return null;
		// Don't show overlay for locked events - this prevents visual movement
		if (data.type === "event" && data.event.isEditable === false) {
			return null;
		}
		if (data.type === "event-resize" && data.event.isEditable === false) {
			return null;
		}
		if (data.type === "event-resize") {
			return <ResizeLine />;
		}
		if (data.type === "event" && data.event) {
			const w = activeNodeRect?.width ?? 120;
			const h = activeNodeRect?.height ?? 40;
			const isMonthSource = data.sourceView === "month";
			return isMonthSource ? (
				<MonthEventBadgePreview
					event={data.event}
					width={w}
					height={h}
					badgeVariant={badgeVariant}
				/>
			) : (
				<EventCardPreview
					event={data.event}
					width={w}
					height={h}
					badgeVariant={badgeVariant}
				/>
			);
		}
		return null;
	}, [
		active,
		data,
		activeNodeRect?.width,
		activeNodeRect?.height,
		badgeVariant,
	]);

	return overlay;
}
