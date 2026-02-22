import { TitleBar } from "@/components/title-bar.tauri";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isTauri } from "@/lib/tauri";
import { CalendarSidebar } from "@/routes/_authenticated/calendar/-components/calendar-sidebar";
import { CalendarTitleBarButtons } from "@/routes/_authenticated/calendar/-components/calendar-title-bar-buttons";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/calendar")({
	component: CalendarLayout,
});

function CalendarLayout() {
	return (
		<SidebarProvider
			titleBar={
				<>
					{isTauri() ? (
						<TitleBar rightContent={<CalendarTitleBarButtons />} />
					) : null}
					{!isTauri() ? (
						<div className="flex h-10 shrink-0 items-center justify-end gap-2 bg-sidebar px-2">
							<CalendarTitleBarButtons />
						</div>
					) : null}
				</>
			}
		>
			<CalendarSidebar />
			<SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
