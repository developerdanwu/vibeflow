import { Button } from "@/components/ui/button";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { useGlobalStore } from "@/lib/global-store";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { Loader2, PanelLeft, PanelLeftClose, RefreshCw, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CalendarTitleBarButtons() {
	const [taskPanelOpen, store] = useGlobalStore((s) => s.context.taskPanelOpen);
	const { data: googleConnection } = useQuery(
		convexQuery(api.googleCalendar.queries.getMyGoogleConnection),
	);
	const { data: linearConnection } = useQuery(
		convexQuery(api.taskProviders.linear.queries.getMyLinearConnection),
	);
	const syncMyCalendars = useAction(
		api.googleCalendar.actionsNode.syncMyCalendars,
	);
	const fetchMyIssues = useAction(
		api.taskProviders.linear.actionsNode.fetchMyIssues,
	);
	const [syncLoading, setSyncLoading] = useState(false);

	const hasCalendar = googleConnection != null;
	const hasTasks = linearConnection != null;
	const canSync = hasCalendar || hasTasks;

	const handleSync = async () => {
		if (!canSync) return;
		setSyncLoading(true);
		try {
			const promises: Promise<unknown>[] = [];
			if (hasCalendar) promises.push(syncMyCalendars());
			if (hasTasks) promises.push(fetchMyIssues());
			await Promise.all(promises);
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
			<Button
				variant="ghost"
				size="icon"
				onClick={handleSync}
				disabled={syncLoading || !canSync}
				aria-label="Sync calendars and tasks"
				title="Sync calendars and tasks"
			>
				{syncLoading ? (
					<Loader2 className="size-4 animate-spin" />
				) : (
					<RefreshCw className="size-4" />
				)}
			</Button>
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
