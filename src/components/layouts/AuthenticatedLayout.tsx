import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface AuthenticatedLayoutProps {
	children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
