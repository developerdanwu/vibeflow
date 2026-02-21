import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TaskItemDragData } from "@/routes/_authenticated/calendar/-components/calendar/components/dnd/dnd-schemas";
import { useDraggable } from "@dnd-kit/core";

export type TaskItemRow = {
	_id: string;
	externalTaskId: string;
	title: string;
	identifier?: string;
	state?: string;
	priority?: number;
	dueDate?: string;
	projectName?: string;
	url: string;
};

export function DraggableTaskRow({ item }: { item: TaskItemRow }) {
	const id = `task-${item._id}`;
	const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
		id,
		data: {
			type: "task",
			taskItem: {
				_id: item._id,
				externalTaskId: item.externalTaskId,
				title: item.title,
				identifier: item.identifier,
				url: item.url,
			},
		} satisfies TaskItemDragData,
	});
	return (
		<div
			ref={setNodeRef}
			className={`flex cursor-grab flex-col gap-1 rounded-md border bg-background p-2 text-sm active:cursor-grabbing ${isDragging ? "opacity-50" : ""}`}
			{...listeners}
			{...attributes}
		>
			<div className="flex items-start justify-between gap-1">
				<span className="font-mono text-muted-foreground text-xs">
					{item.identifier ?? item.externalTaskId}
				</span>
			</div>
			<Tooltip disableHoverablePopup>
				<TooltipTrigger
					render={
						<span className="line-clamp-1 font-medium">{item.title}</span>
					}
				/>
				<TooltipContent side="top" className="max-w-sm">
					{item.title}
				</TooltipContent>
			</Tooltip>
			{(item.state ?? item.dueDate ?? item.projectName) && (
				<div className="flex flex-wrap gap-x-2 gap-y-0.5 text-muted-foreground text-xs">
					{item.state && (
						<span className="rounded bg-muted px-1.5 py-0.5">{item.state}</span>
					)}
					{item.dueDate && <span>Due {item.dueDate}</span>}
					{item.projectName && (
						<span className="truncate">{item.projectName}</span>
					)}
				</div>
			)}
		</div>
	);
}
