import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useGlobalStore } from "@/lib/global-store";
import { Link, useRouteContext } from "@tanstack/react-router";
import { Calendar, Columns3, Inbox, Rows2 } from "lucide-react";

export function CalendarSidebar() {
	const { auth } = useRouteContext({ from: "__root__" });
	const user = auth.user;
	const [taskPanelOpen, store] = useGlobalStore((s) => s.context.taskPanelOpen);
	const [taskPanelId] = useGlobalStore((s) => s.context.taskPanelId);

	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => {
								store.send({ type: "openTaskPanel", taskPanelId: "inbox" });
							}}
							isActive={taskPanelOpen && taskPanelId === "inbox"}
							tooltip="Inbox"
						>
							<Inbox />
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => {
								store.send({ type: "openTaskPanel", taskPanelId: "today" });
							}}
							isActive={taskPanelOpen && taskPanelId === "today"}
							tooltip="Today"
						>
							<Calendar />
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => {
								store.send({ type: "openTaskPanel", taskPanelId: "upcoming" });
							}}
							isActive={taskPanelOpen && taskPanelId === "upcoming"}
							tooltip="Upcoming"
						>
							<Columns3 />
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => {
								store.send({ type: "openTaskPanel", taskPanelId: "all-tasks" });
							}}
							isActive={taskPanelOpen && taskPanelId === "all-tasks"}
							tooltip="All tasks"
						>
							<Rows2 />
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent />

			<SidebarFooter>
				{user ? (
					<DropdownMenu>
						<DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
							<Avatar className="size-8">
								<AvatarImage
									src={user.profilePictureUrl ?? undefined}
									alt={`${user.firstName} ${user.lastName}`}
								/>
								<AvatarFallback>
									{user.firstName?.[0]}
									{user.lastName?.[0]}
								</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent side="right" align="end">
							<DropdownMenuItem render={<Link to="/settings" />}>
								Settings
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</SidebarFooter>
		</Sidebar>
	);
}
