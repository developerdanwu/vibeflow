import { useState } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";

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
			<main className="h-full w-full">{children}</main>
		</SidebarProvider>
	);
}
