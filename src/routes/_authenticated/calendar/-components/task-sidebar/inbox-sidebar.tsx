import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isPast, isToday, parse } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { DraggableTaskRow, type TaskItemRow } from "./draggable-task-row";

const DUE_DATE_FORMAT = "yyyy-MM-dd";

type GroupKey = "overdue" | "today" | "upcoming" | "noDueDate";

type GroupedTasks = Record<GroupKey, TaskItemRow[]>;

function groupTasksByDueDate(items: TaskItemRow[]): GroupedTasks {
	const overdue: TaskItemRow[] = [];
	const today: TaskItemRow[] = [];
	const upcoming: TaskItemRow[] = [];
	const noDueDate: TaskItemRow[] = [];

	for (const item of items) {
		if (!item.dueDate) {
			noDueDate.push(item);
			continue;
		}
		const due = parse(item.dueDate, DUE_DATE_FORMAT, new Date());
		if (isPast(due) && !isToday(due)) {
			overdue.push(item);
		} else if (isToday(due)) {
			today.push(item);
		} else {
			upcoming.push(item);
		}
	}

	return { overdue, today, upcoming, noDueDate };
}

const SECTION_LABELS: Record<GroupKey, string> = {
	overdue: "Overdue",
	today: "Today",
	upcoming: "Upcoming",
	noDueDate: "No due date",
};

const SECTION_ORDER: GroupKey[] = ["overdue", "today", "upcoming", "noDueDate"];

const INBOX_CAP = 20;

export function InboxSidebar() {
	const { data: taskItems, isLoading: tasksLoading } = useQuery(
		convexQuery(api.taskProviders.linear.queries.getMyTaskItems),
	);
	const { data: scheduledIds = [], isLoading: scheduledLoading } = useQuery(
		convexQuery(
			api.eventTaskLinks.queries.getScheduledExternalTaskIdsForCurrentUser,
		),
	);
	const { mutateAsync: fetchMyIssues } = useMutation({
		mutationFn: useConvexMutation(api.taskProviders.linear.mutations.fetchMyIssues),
	});
	const [refreshLoading, setRefreshLoading] = useState(false);

	const scheduledSet = useMemo(() => new Set(scheduledIds), [scheduledIds]);

	const { unscheduledGrouped, scheduledList, totalCount } = useMemo(() => {
		const items = (taskItems ?? []) as TaskItemRow[];
		const unscheduled: TaskItemRow[] = [];
		const scheduled: TaskItemRow[] = [];
		for (const item of items) {
			if (scheduledSet.has(item.externalTaskId)) {
				scheduled.push(item);
			} else {
				unscheduled.push(item);
			}
		}
		return {
			unscheduledGrouped: groupTasksByDueDate(unscheduled),
			scheduledList: scheduled,
			totalCount: items.length,
		};
	}, [taskItems, scheduledSet]);

	// Sections: Overdue / Today / Upcoming / No due date (unscheduled only), then Scheduled. Apply cap across all.
	const { sectionsToRender, cappedCount } = useMemo(() => {
		const sections: { label: string; items: TaskItemRow[] }[] = [];
		let shown = 0;
		const cap = INBOX_CAP;

		for (const key of SECTION_ORDER) {
			const items = unscheduledGrouped[key];
			if (items.length === 0) continue;
			const take = Math.min(items.length, cap - shown);
			sections.push({
				label: SECTION_LABELS[key],
				items: items.slice(0, take),
			});
			shown += take;
			if (shown >= cap) break;
		}

		if (shown < cap && scheduledList.length > 0) {
			const take = Math.min(scheduledList.length, cap - shown);
			sections.push({
				label: "Scheduled",
				items: scheduledList.slice(0, take),
			});
			shown += take;
		}

		const totalShown = sections.reduce((n, s) => n + s.items.length, 0);
		return {
			sectionsToRender: sections,
			cappedCount: totalCount > totalShown ? totalCount - totalShown : 0,
		};
	}, [unscheduledGrouped, scheduledList, totalCount]);

	const handleRefresh = async () => {
		setRefreshLoading(true);
		try {
			await fetchMyIssues({});
		} finally {
			setRefreshLoading(false);
		}
	};

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col border-r bg-muted/30">
			<div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
				<span className="font-medium text-sm">Inbox</span>
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
				<div className="flex flex-col gap-3 p-2">
					{tasksLoading || scheduledLoading ? (
						<p className="px-2 py-4 text-center text-muted-foreground text-sm">
							Loading…
						</p>
					) : !taskItems?.length ? (
						<p className="px-2 py-4 text-center text-muted-foreground text-sm">
							Nothing in your inbox. Connect Linear in Settings and refresh.
						</p>
					) : (
						<>
							{sectionsToRender.map((section) => (
								<div key={section.label} className="flex flex-col gap-1">
									<h3
										className={`px-1 font-medium text-xs uppercase tracking-wider ${section.label === "Scheduled" ? "text-muted-foreground/80" : "text-muted-foreground"}`}
									>
										{section.label}
									</h3>
									{section.items.map((item) => (
										<DraggableTaskRow key={item._id} item={item} />
									))}
								</div>
							))}
							{cappedCount > 0 ? (
								<p className="px-2 py-1 text-center text-muted-foreground text-xs">
									{cappedCount} more in All tasks
								</p>
							) : null}
						</>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
