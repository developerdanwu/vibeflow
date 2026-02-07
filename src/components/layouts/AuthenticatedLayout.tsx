import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface AuthenticatedLayoutProps {
	children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="min-h-0 overflow-hidden">
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
