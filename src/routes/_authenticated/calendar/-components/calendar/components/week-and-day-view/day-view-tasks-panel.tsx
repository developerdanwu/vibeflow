import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TaskItemRow } from "@/routes/_authenticated/calendar/-components/task-sidebar/draggable-task-row";
import { DraggableTaskRow } from "@/routes/_authenticated/calendar/-components/task-sidebar/draggable-task-row";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo } from "react";

const ROW_HEIGHT = 52;
const PADDING = 72;
const MAX_HEIGHT = 280;
const COLLAPSED_HEIGHT = 40;

export interface DayViewTasksPanelProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tasksPerDay: TaskItemRow[][];
	days: Date[];
}

export function DayViewTasksPanel({
	open,
	onOpenChange,
	tasksPerDay,
	days,
}: DayViewTasksPanelProps) {
	const contentHeight = useMemo(() => {
		if (!open) return COLLAPSED_HEIGHT;
		const maxCount = Math.max(0, ...tasksPerDay.map((tasks) => tasks.length));
		return Math.min(MAX_HEIGHT, PADDING + maxCount * ROW_HEIGHT);
	}, [open, tasksPerDay]);

	return (
		<div
			className="sticky right-0 bottom-0 left-0 z-50 flex w-full shrink-0 border-t bg-background"
			style={{ height: contentHeight }}
		>
			<div className="flex w-18 shrink-0 items-center justify-center bg-background">
				<Button
					onClick={() => onOpenChange(!open)}
					size="icon-sm"
					variant="ghost"
				>
					{open ? <ChevronDown /> : <ChevronUp />}
				</Button>
			</div>
			{days.map((day, i) => (
				<div
					key={format(day, "yyyy-MM-dd")}
					className="min-w-0 flex-1 border-l"
				>
					{open ? (
						<ScrollArea className="h-full w-full">
							<div className="flex flex-col gap-1 p-2">
								{(tasksPerDay[i] ?? []).length === 0 ? (
									<p className="py-4 text-center text-muted-foreground text-sm">
										No tasks linked to events this day
									</p>
								) : (
									(tasksPerDay[i] ?? []).map((item) => (
										<DraggableTaskRow key={item._id} item={item} />
									))
								)}
							</div>
						</ScrollArea>
					) : null}
				</div>
			))}
		</div>
	);
}
