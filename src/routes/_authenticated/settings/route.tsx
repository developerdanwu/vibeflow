import { TitleBar } from "@/components/title-bar.tauri";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsSidebar } from "./-components/settings-sidebar";

export const Route = createFileRoute("/_authenticated/settings")({
	component: SettingsLayout,
});

function SettingsLayout() {
	return (
		<SidebarProvider titleBar={<TitleBar />}>
			<SettingsSidebar />
			<SidebarInset className="min-w-0 flex-1 overflow-auto p-6">
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
