import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TasksPanelProps {
	isOpen: boolean;
	onClose: () => void;
}

export function TasksPanel({ isOpen, onClose }: TasksPanelProps) {
	return (
		<div
			className={cn(
				"fixed inset-y-0 left-[var(--sidebar-width)] z-40 w-80 border-r bg-background shadow-lg",
				"transform transition-transform duration-300 ease-in-out",
				isOpen ? "translate-x-0" : "-translate-x-full",
			)}
		>
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-between border-b p-4">
					<h2 className="font-semibold text-lg">Tasks</h2>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="size-4" />
						<span className="sr-only">Close tasks panel</span>
					</Button>
				</div>
				<div className="flex-1 p-4">
					<p className="text-muted-foreground">Tasks coming soon...</p>
				</div>
			</div>
		</div>
	);
}
