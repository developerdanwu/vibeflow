import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CalendarSidebar } from "@/routes/_authenticated/calendar/-components/calendar-sidebar";

interface AuthenticatedLayoutProps {
	children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
	return (
		<SidebarProvider>
			<CalendarSidebar />
			<SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
