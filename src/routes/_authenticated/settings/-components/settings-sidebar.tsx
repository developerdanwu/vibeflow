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
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	Link,
	useNavigate,
	useRouteContext,
	useRouterState,
} from "@tanstack/react-router";
import { ArrowLeft, Calendar, Plug, User } from "lucide-react";

const navItems = [
	{ to: "/settings/account", label: "Account", icon: User },
	{ to: "/settings/calendars", label: "Calendars", icon: Calendar },
	{ to: "/settings/integrations", label: "Integrations", icon: Plug },
] as const;

export function SettingsSidebar() {
	const { auth } = useRouteContext({ from: "__root__" });
	const user = auth.user;
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();

	return (
		<Sidebar variant="expanded">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							render={(props) => (
								<Link to="/calendar" {...props} search={{}}>
									<ArrowLeft className="size-4" />
									<span>Back</span>
								</Link>
							)}
						/>
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
