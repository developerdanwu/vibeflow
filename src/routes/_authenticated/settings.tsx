import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { ArrowLeft, Calendar, Plug, User } from "lucide-react";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
	component: SettingsLayout,
});

const navItems = [
	{ to: "/settings/account", label: "Account", icon: User },
	{ to: "/settings/calendars", label: "Calendars", icon: Calendar },
	{ to: "/settings/integrations", label: "Integrations", icon: Plug },
] as const;

function SettingsLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<div className="flex min-h-0 flex-1">
			<aside
				className={cn(
					"flex w-[200px] shrink-0 flex-col border-sidebar-border border-r bg-sidebar p-3",
				)}
			>
				<div className="mb-4">
					<Link
						to="/calendar"
						className="inline-flex h-6 items-center gap-1 rounded-[min(var(--radius-md),10px)] px-2 font-medium text-sidebar-foreground text-xs outline-none transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
					>
						<ArrowLeft className="size-4" />
						Back
					</Link>
				</div>
				<nav className="flex flex-col gap-0.5">
					{navItems.map(({ to, label, icon: Icon }) => {
						const isActive = pathname === to;
						return (
							<Link
								key={to}
								to={to}
								className={cn(
									"flex items-center gap-2 rounded-md px-2 py-1.5 font-medium text-sm transition-colors",
									isActive
										? "bg-sidebar-accent text-sidebar-accent-foreground"
										: "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
								)}
							>
								<Icon className="size-4 shrink-0" />
								{label}
							</Link>
						);
					})}
				</nav>
			</aside>
			<main className="min-w-0 flex-1 overflow-auto p-6">
				<Outlet />
			</main>
		</div>
	);
}
