import { useState } from "react";

import { TasksPanel } from "@/components/TasksPanel";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface AuthenticatedLayoutProps {
	children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
	const [isTasksPanelOpen, setIsTasksPanelOpen] = useState(false);

	const handleTasksClick = () => {
		setIsTasksPanelOpen(true);
	};

	const handleSettingsClick = () => {
		// TODO: Navigate to settings or show "coming soon" toast
		console.log("Settings clicked - coming soon");
	};

	const handleTasksPanelClose = () => {
		setIsTasksPanelOpen(false);
	};

	return (
		<SidebarProvider>
			{/* <AppSidebar
				onTasksClick={handleTasksClick}
				onSettingsClick={handleSettingsClick}
			/> */}
			<SidebarInset>
				<div className="flex h-screen flex-col overflow-auto">{children}</div>
			</SidebarInset>
			<TasksPanel isOpen={isTasksPanelOpen} onClose={handleTasksPanelClose} />
		</SidebarProvider>
	);
}
