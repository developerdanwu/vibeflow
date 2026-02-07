import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@workos/authkit-tanstack-react-start/client";
import { Calendar } from "lucide-react";

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

export function AppSidebar() {
	const { user } = useAuth();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isCalendarActive = pathname === "/calendar";
	const navigate = useNavigate();

	return (
		<Sidebar>
			<SidebarHeader className="border-sidebar-border border-b">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => navigate({ to: "/calendar" })}
							isActive={isCalendarActive}
							tooltip="Home"
						>
							<Calendar className="size-4" />
							<span>Home</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent />

			<SidebarFooter className="border-sidebar-border border-t">
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
							<DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
								Settings
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</SidebarFooter>
		</Sidebar>
	);
}
