import { useAuth } from "@workos-inc/authkit-react";
import { CheckSquare, LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
	onTasksClick?: () => void;
	onSettingsClick?: () => void;
}

export function AppSidebar({ onTasksClick, onSettingsClick }: AppSidebarProps) {
	const { user, signIn, signOut, isLoading } = useAuth();
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-sidebar-border border-b">
				<div className="flex items-center gap-2 px-2 py-1">
					<div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
						V
					</div>
					{!isCollapsed && (
						<span className="font-semibold text-lg">VibeFlow</span>
					)}
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton onClick={onTasksClick} tooltip="Tasks">
									<CheckSquare className="size-4" />
									<span>Tasks</span>
								</SidebarMenuButton>
							</SidebarMenuItem>

							<SidebarMenuItem>
								<SidebarMenuButton onClick={onSettingsClick} tooltip="Settings">
									<Settings className="size-4" />
									<span>Settings</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-sidebar-border border-t">
				{user ? (
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2 px-2">
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
							{!isCollapsed && (
								<div className="flex min-w-0 flex-col">
									<span className="truncate font-medium text-sm">
										{user.firstName} {user.lastName}
									</span>
									<span className="truncate text-muted-foreground text-xs">
										{user.email}
									</span>
								</div>
							)}
						</div>
						{!isCollapsed && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => signOut()}
								className="w-full justify-start gap-2"
							>
								<LogOut className="size-4" />
								Sign Out
							</Button>
						)}
					</div>
				) : (
					<Button
						onClick={() => signIn()}
						disabled={isLoading}
						className="w-full"
						size={isCollapsed ? "icon" : "default"}
					>
						{isCollapsed ? "→" : "Sign In"}
					</Button>
				)}
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
