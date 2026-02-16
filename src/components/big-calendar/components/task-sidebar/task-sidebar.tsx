"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { CalendarPlus, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { TaskItemForSchedule } from "./schedule-task-dialog";
import { ScheduleTaskDialog } from "./schedule-task-dialog";

type TaskItemRow = {
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

export function TaskSidebar() {
	const { data: taskItems, isLoading } = useQuery(
		convexQuery(api.taskProviders.linear.queries.getMyTaskItems),
	);
	const fetchMyIssues = useAction(
		api.taskProviders.linear.actionsNode.fetchMyIssues,
	);
	const [refreshLoading, setRefreshLoading] = useState(false);
	const [scheduleTask, setScheduleTask] = useState<TaskItemForSchedule | null>(
		null,
	);
	const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

	const handleRefresh = async () => {
		setRefreshLoading(true);
		try {
			await fetchMyIssues();
		} finally {
			setRefreshLoading(false);
		}
	};

	const handleSchedule = (item: TaskItemRow) => {
		setScheduleTask({
			_id: item._id,
			externalTaskId: item.externalTaskId,
			title: item.title,
			identifier: item.identifier,
			url: item.url,
		});
		setScheduleDialogOpen(true);
	};

	return (
		<>
			<div className="flex w-72 shrink-0 flex-col border-l bg-muted/30">
				<div className="flex items-center justify-between gap-2 border-b px-3 py-2">
					<span className="font-medium text-sm">Linear tasks</span>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={handleRefresh}
						disabled={refreshLoading}
						title="Refresh issues"
					>
						{refreshLoading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<RefreshCw className="size-4" />
						)}
					</Button>
				</div>
				<ScrollArea className="flex-1">
					<div className="flex flex-col gap-1 p-2">
						{isLoading ? (
							<p className="px-2 py-4 text-center text-muted-foreground text-sm">
								Loading…
							</p>
						) : !taskItems?.length ? (
							<p className="px-2 py-4 text-center text-muted-foreground text-sm">
								No issues. Connect Linear in Settings and refresh.
							</p>
						) : (
							taskItems.map((item: TaskItemRow) => (
								<div
									key={item._id}
									className="flex flex-col gap-1 rounded-md border bg-background p-2 text-sm"
								>
									<div className="flex items-start justify-between gap-1">
										<span className="font-mono text-muted-foreground text-xs">
											{item.identifier ?? item.externalTaskId}
										</span>
										<Button
											variant="ghost"
											size="icon-sm"
											className="shrink-0"
											onClick={() => handleSchedule(item)}
											title="Schedule on calendar"
										>
											<CalendarPlus className="size-4" />
										</Button>
									</div>
									<span className="line-clamp-2 font-medium">{item.title}</span>
									{(item.state ?? item.dueDate ?? item.projectName) && (
										<div className="flex flex-wrap gap-x-2 gap-y-0.5 text-muted-foreground text-xs">
											{item.state && (
												<span className="rounded bg-muted px-1.5 py-0.5">
													{item.state}
												</span>
											)}
											{item.dueDate && <span>Due {item.dueDate}</span>}
											{item.projectName && (
												<span className="truncate">{item.projectName}</span>
											)}
										</div>
									)}
								</div>
							))
						)}
					</div>
				</ScrollArea>
			</div>
			<ScheduleTaskDialog
				open={scheduleDialogOpen}
				onOpenChange={setScheduleDialogOpen}
				task={scheduleTask}
			/>
		</>
	);
}
