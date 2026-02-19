import { createStoreHook } from "@xstate/store-react";

const initialTaskPanelOpen = localStorage.getItem("task-panel-open")
	? localStorage.getItem("task-panel-open") === "true"
	: true;

export const useGlobalStore = createStoreHook({
	context: {
		taskPanelOpen: initialTaskPanelOpen,
	},
	on: {
		openTaskPanel: (context, _: null, enqueue) => {
			enqueue.effect(() => {
				localStorage.setItem("task-panel-open", "true");
			});
			return {
				...context,
				taskPanelOpen: true,
			};
		},
		closeTaskPanel: (context, _: null, enqueue) => {
			enqueue.effect(() => {
				localStorage.setItem("task-panel-open", "false");
			});
			return {
				...context,
				taskPanelOpen: false,
			};
		},
	},
});
