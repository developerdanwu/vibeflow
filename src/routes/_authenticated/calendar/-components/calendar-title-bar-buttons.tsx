import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { useGlobalStore } from "@/lib/global-store";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useAction } from "convex/react";
import {
	CheckCircle2,
	Loader2,
	PanelLeft,
	PanelLeftClose,
	RefreshCw,
	Settings,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CalendarTitleBarButtons() {
	const [taskPanelOpen, store] = useGlobalStore((s) => s.context.taskPanelOpen);
	const { data: googleConnection } = useQuery(
		convexQuery(api.googleCalendar.queries.getMyGoogleConnection),
	);
	const { data: linearConnections } = useQuery(
		convexQuery(api.taskProviders.linear.queries.getMyLinearConnections),
	);
	const syncMyCalendars = useAction(
		api.googleCalendar.actionsNode.syncMyCalendars,
	);
	const [syncLoading, setSyncLoading] = useState(false);

	const calendars = googleConnection?.googleCalendars ?? [];
	const calendarsWithRunId = calendars.filter(
		(c): c is typeof c & { latestSyncWorkflowRunId: string } =>
			Boolean(c.latestSyncWorkflowRunId),
	);
	const statusQueries = useQueries({
		queries: calendarsWithRunId.map((cal) =>
			convexQuery(api.googleCalendar.queries.getSyncWorkflowStatus, {
				workflowId: cal.latestSyncWorkflowRunId,
			}),
		),
	});
	const linearConnectionsWithRunId = (linearConnections ?? []).filter(
		(c): c is typeof c & { latestSyncWorkflowRunId: string } =>
			Boolean(c.latestSyncWorkflowRunId),
	);
	const linearStatusQueries = useQueries({
		queries: linearConnectionsWithRunId.map((conn) =>
			convexQuery(
				api.taskProviders.linear.queries.getLinearSyncWorkflowStatus,
				{ workflowId: conn.latestSyncWorkflowRunId },
			),
		),
	});

	const hasCalendar = googleConnection != null;
	const hasTasks = (linearConnections?.length ?? 0) > 0;
	const canSync = hasCalendar || hasTasks;

	const isCalendarSyncing =
		calendarsWithRunId.length > 0 &&
		(statusQueries.some((q) => q.isPending) ||
			statusQueries.some(
				(q) => q.data && "type" in q.data && q.data.type === "inProgress",
			));
	const isLinearSyncing =
		linearConnectionsWithRunId.length > 0 &&
		(linearStatusQueries.some((q) => q.isPending) ||
			linearStatusQueries.some(
				(q) =>
					q.data &&
					"type" in q.data &&
					q.data.type === "inProgress",
			));
	const isSyncing = syncLoading || isCalendarSyncing || isLinearSyncing;

	function getCalendarStatusLines(): {
		name: string;
		status: string;
		icon: "syncing" | "ok" | "fail" | "idle";
	}[] {
		const lines: {
			name: string;
			status: string;
			icon: "syncing" | "ok" | "fail" | "idle";
		}[] = [];
		for (const cal of calendars) {
			const runId = cal.latestSyncWorkflowRunId;
			const idx = runId
				? calendarsWithRunId.findIndex(
						(c) => c.latestSyncWorkflowRunId === runId,
					)
				: -1;
			const statusData = idx >= 0 ? statusQueries[idx]?.data : undefined;
			const lastError = cal.lastSyncErrorMessage;

			if (idx >= 0 && statusQueries[idx]?.isPending) {
				lines.push({ name: cal.name, status: "Syncing…", icon: "syncing" });
			} else if (statusData && "type" in statusData) {
				if (statusData.type === "inProgress") {
					lines.push({ name: cal.name, status: "Syncing…", icon: "syncing" });
				} else if (statusData.type === "completed") {
					lines.push({ name: cal.name, status: "Synced", icon: "ok" });
				} else if (statusData.type === "failed") {
					lines.push({
						name: cal.name,
						status: statusData.error ?? "Failed",
						icon: "fail",
					});
				} else {
					lines.push({ name: cal.name, status: "—", icon: "idle" });
				}
			} else if (lastError) {
				lines.push({ name: cal.name, status: lastError, icon: "fail" });
			} else {
				lines.push({ name: cal.name, status: "—", icon: "idle" });
			}
		}
		return lines;
	}

	const statusLines = getCalendarStatusLines();
	const showStatusList = statusLines.length > 0 || hasTasks;
	const tooltipContent = showStatusList ? (
		<div className="grid gap-1 text-left text-xs">
			{statusLines.map(({ name, status, icon }) => (
				<div key={name} className="flex items-center gap-2" title={status}>
					{icon === "syncing" && (
						<Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
					)}
					{icon === "ok" && (
						<CheckCircle2 className="size-3 shrink-0 text-green-600 dark:text-green-500" />
					)}
					{icon === "fail" && (
						<XCircle className="size-3 shrink-0 text-destructive" />
					)}
					{icon === "idle" && <span className="inline-block size-3 shrink-0" />}
					<span className="truncate font-medium">{name}</span>
					<span className="truncate text-muted-foreground">{status}</span>
				</div>
			))}
			{(linearConnections ?? []).map((conn, i) => {
				const runId = conn.latestSyncWorkflowRunId;
				const idx = runId
					? linearConnectionsWithRunId.findIndex(
							(c) => c.latestSyncWorkflowRunId === runId,
						)
					: -1;
				const statusData = idx >= 0 ? linearStatusQueries[idx]?.data : undefined;
				const lastError = conn.lastSyncErrorMessage;
				const label =
					conn.providerMetadata &&
					typeof conn.providerMetadata === "object" &&
					"organizationName" in conn.providerMetadata &&
					conn.providerMetadata.organizationName
						? String(conn.providerMetadata.organizationName)
						: "Tasks (Linear)";
				let tasksIcon: "syncing" | "ok" | "fail" | "idle" = "idle";
				let tasksStatus = "—";
				if (idx >= 0 && linearStatusQueries[idx]?.isPending) {
					tasksIcon = "syncing";
					tasksStatus = "Syncing…";
				} else if (statusData && "type" in statusData) {
					if (statusData.type === "inProgress") {
						tasksIcon = "syncing";
						tasksStatus = "Syncing…";
					} else if (statusData.type === "completed") {
						tasksIcon = "ok";
						tasksStatus = "Synced";
					} else if (statusData.type === "failed") {
						tasksIcon = "fail";
						tasksStatus = statusData.error ?? "Failed";
					}
				} else if (lastError) {
					tasksIcon = "fail";
					tasksStatus = lastError;
				}
				return (
					<div
						key={conn.connectionId}
						className={`flex items-center gap-2 ${i === 0 ? "mt-1 border-t pt-1" : ""}`}
						title={tasksStatus}
					>
						{tasksIcon === "syncing" && (
							<Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
						)}
						{tasksIcon === "ok" && (
							<CheckCircle2 className="size-3 shrink-0 text-green-600 dark:text-green-500" />
						)}
						{tasksIcon === "fail" && (
							<XCircle className="size-3 shrink-0 text-destructive" />
						)}
						{tasksIcon === "idle" && (
							<span className="inline-block size-3 shrink-0" />
						)}
						<span className="truncate font-medium">{label}</span>
						<span className="truncate text-muted-foreground">
							{tasksStatus}
						</span>
					</div>
				);
			})}
		</div>
	) : (
		<span className="text-xs">Sync calendars and tasks</span>
	);

	const handleSync = async () => {
		if (!canSync) return;
		setSyncLoading(true);
		try {
			await syncMyCalendars();
			if (hasCalendar && hasTasks) {
				toast.success("Calendars and tasks synced");
			} else if (hasCalendar) {
				toast.success("Calendars synced");
			} else {
				toast.success("Tasks synced");
			}
		} catch (err) {
			toast.error(getConvexErrorMessage(err, "Sync failed"));
		} finally {
			setSyncLoading(false);
		}
	};

	return (
		<div className="flex items-center">
			{taskPanelOpen ? (
				<Button
					variant="ghost"
					size="icon"
					onClick={() => store.send({ type: "closeTaskPanel" })}
					aria-label="Close Linear task panel"
				>
					<PanelLeftClose />
				</Button>
			) : null}
			{!taskPanelOpen ? (
				<Button
					variant="ghost"
					size="icon"
					onClick={() => store.send({ type: "openTaskPanel" })}
					aria-label="Open Linear task panel"
				>
					<PanelLeft />
				</Button>
			) : null}
			<Tooltip disableHoverablePopup>
				<TooltipTrigger
					render={
						<Button
							variant="ghost"
							size="icon"
							onClick={handleSync}
							disabled={isSyncing || !canSync}
							aria-label="Sync calendars and tasks"
						>
							{isSyncing ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<RefreshCw className="size-4" />
							)}
						</Button>
					}
				/>
				<TooltipContent side="bottom" className="max-w-xs p-3">
					{tooltipContent}
				</TooltipContent>
			</Tooltip>
			<Button
				variant="ghost"
				size="icon"
				render={<Link to="/settings" state={{}} />}
				aria-label="Open settings"
			>
				<Settings />
			</Button>
		</div>
	);
}
