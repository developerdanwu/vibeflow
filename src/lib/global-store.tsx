import { createStoreHook } from "@xstate/store-react";

export const useGlobalStore = createStoreHook({
	context: {
		sidebarOpen: false,
		taskPanelOpen: true,
	},
	on: {
		openSidebar: (context) => ({
			...context,
			sidebarOpen: true,
		}),
		closeSidebar: (context) => ({
			...context,
			sidebarOpen: false,
		}),
		openTaskPanel: (context) => ({
			...context,
			taskPanelOpen: true,
		}),
		closeTaskPanel: (context) => ({
			...context,
			taskPanelOpen: false,
		}),
	},
});
