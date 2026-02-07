"use client";

import { ZCalendarDragData } from "@/components/big-calendar/components/dnd/dnd-schemas";
import { isEventResizeData } from "@/components/big-calendar/components/dnd/draggable-event";
import type { TEvent } from "@/components/big-calendar/interfaces";
import { useDndContext } from "@dnd-kit/core";
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

function EventCardPreview({
	event,
	width,
	height,
}: {
	event: TEvent;
	width: number;
	height: number;
}) {
	const colorClass =
		event.color === "blue"
			? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950"
			: event.color === "green"
				? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950"
				: event.color === "red"
					? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950"
					: event.color === "yellow"
						? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950"
						: event.color === "purple"
							? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950"
							: event.color === "orange"
								? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950"
								: "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900";
	return (
		<div
			className={`flex select-none flex-col justify-center truncate rounded-md border px-2 py-1.5 text-xs ${colorClass}`}
			style={{
				width: Math.max(width, 80),
				height: Math.max(height, 24),
			}}
		>
			<p className="truncate font-semibold">{event.title || "Untitled"}</p>
		</div>
	);
}

export function CalendarDragOverlayContent() {
	const { active, activeNodeRect } = useDndContext();
	const result = ZCalendarDragData.safeParse(active?.data.current);
	const data = result.success ? result.data : undefined;

	const overlay = useMemo(() => {
		if (!active || !data) return null;
		if (isEventResizeData(data)) {
			return <ResizeLine />;
		}
		if (data.type === "event" && data.event) {
			const w = activeNodeRect?.width ?? 120;
			const h = activeNodeRect?.height ?? 40;
			return <EventCardPreview event={data.event} width={w} height={h} />;
		}
		return null;
	}, [active, data, activeNodeRect?.width, activeNodeRect?.height]);

	return overlay;
}
