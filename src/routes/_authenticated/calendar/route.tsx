import { TitleBar } from "@/components/title-bar.tauri";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useGlobalStore } from "@/lib/global-store";
import { CalendarSidebar } from "@/routes/_authenticated/calendar/-components/calendar-sidebar";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PanelLeft, PanelLeftClose, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calendar")({
	component: CalendarLayout,
});

function CalendarLayout() {
	const [taskPanelOpen, store] = useGlobalStore((s) => s.context.taskPanelOpen);

	return (
		<SidebarProvider
			titleBar={
				<TitleBar
					rightContent={
						<div className="flex items-center">
							{taskPanelOpen ? (
								<Button
									variant={"ghost"}
									size="icon"
									onClick={() => store.send({ type: "closeTaskPanel" })}
									aria-label="Toggle Linear task panel"
								>
									<PanelLeftClose />
								</Button>
							) : null}
							{!taskPanelOpen ? (
								<Button
									variant={"ghost"}
									size="icon"
									onClick={() => store.send({ type: "openTaskPanel" })}
									aria-label="Toggle Linear task panel"
								>
									<PanelLeft />
								</Button>
							) : null}
							<Button
								variant={"ghost"}
								size="icon"
								render={<Link to="/settings" />}
								aria-label="Toggle Linear task panel"
							>
								<Settings />
							</Button>
						</div>
					}
				/>
			}
		>
			<CalendarSidebar />
			<SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
