import { createStoreHook } from "@xstate/store-react";

export const useGlobalStore = createStoreHook({
	context: {
		taskPanelOpen: false,
		taskPanelId:
			(localStorage.getItem("taskPanelId") as
				| "inbox"
				| "today"
				| "upcoming"
				| "all-tasks") || "inbox",
	},
	emits: {
		openTaskPanel: () => {},
		closeTaskPanel: () => {},
	},
	on: {
		syncTaskPanelOpen: (
			context,
			event: {
				taskPanelOpen: boolean;
			},
		) => {
			return {
				...context,
				taskPanelOpen: event.taskPanelOpen,
			};
		},
		openTaskPanel: (
			context,
			event: { taskPanelId?: "inbox" | "today" | "upcoming" | "all-tasks" },
			enqueue,
		) => {
			enqueue.emit.openTaskPanel();
			localStorage.setItem("taskPanelId", event.taskPanelId ?? "inbox");
			return {
				...context,
				...(event.taskPanelId ? { taskPanelId: event.taskPanelId } : {}),
			};
		},
		closeTaskPanel: (context, _: Record<string, any>, enqueue) => {
			enqueue.emit.closeTaskPanel();
			return context;
		},
	},
});
