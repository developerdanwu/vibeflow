import { createStoreHook } from "@xstate/store-react";

export const useGlobalStore = createStoreHook({
	context: {
		taskPanelOpen: false,
	},
	emits: {
		openTaskPanel: () => {},
		closeTaskPanel: () => {},
	},
	on: {
		syncTaskPanelOpen: (context, event: { taskPanelOpen: boolean }) => {
			return {
				...context,
				taskPanelOpen: event.taskPanelOpen,
			};
		},
		openTaskPanel: (context, _: Record<string, any>, enqueue) => {
			enqueue.emit.openTaskPanel();
			return context;
		},
		closeTaskPanel: (context, _: Record<string, any>, enqueue) => {
			enqueue.emit.closeTaskPanel();
			return context;
		},
	},
});
