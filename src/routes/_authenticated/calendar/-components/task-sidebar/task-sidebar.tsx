import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { DraggableTaskRow, type TaskItemRow } from "./draggable-task-row";

export function TaskSidebar() {
	const { data: taskItems, isLoading } = useQuery(
		convexQuery(api.taskProviders.linear.queries.getMyTaskItems),
	);
	const fetchMyIssues = useAction(
		api.taskProviders.linear.actionsNode.fetchMyIssues,
	);
	const [refreshLoading, setRefreshLoading] = useState(false);

	const handleRefresh = async () => {
		setRefreshLoading(true);
		try {
			await fetchMyIssues();
		} finally {
			setRefreshLoading(false);
		}
	};

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col border-r bg-muted/30">
			<div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
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
			<ScrollArea className="min-h-0 flex-1">
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
							<DraggableTaskRow key={item._id} item={item} />
						))
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
