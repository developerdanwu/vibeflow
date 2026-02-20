import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Plug, User } from "lucide-react";

const navItems = [
	{ to: "/settings/account", label: "Account", icon: User },
	{ to: "/settings/calendars", label: "Calendars", icon: Calendar },
	{ to: "/settings/integrations", label: "Integrations", icon: Plug },
] as const;

export function SettingsSidebar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<Sidebar variant="expanded">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton render={<Link to="/calendar" />}>
							<ArrowLeft className="size-4" />
							<span>Back</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map(({ to, label, icon: Icon }) => (
								<SidebarMenuItem key={to}>
									<SidebarMenuButton
										isActive={pathname === to}
										render={(props) => (
											<Link to={to} {...props}>
												<Icon className="size-4" />
												<span>{label}</span>
											</Link>
										)}
									/>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
