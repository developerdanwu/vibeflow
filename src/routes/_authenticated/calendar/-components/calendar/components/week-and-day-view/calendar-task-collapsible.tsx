import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ListTodo } from "lucide-react";
import { useState } from "react";

/** Collapsible task section; can be controlled (open/onOpenChange) so multiple instances stay in sync. Set showTrigger=false when using an external button. */
export function CalendarTaskCollapsible({
	open: controlledOpen,
	onOpenChange,
	showTrigger = true,
}: {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** When false, only the content is rendered (trigger is a separate button elsewhere). */
	showTrigger?: boolean;
} = {}) {
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;
	const setOpen = isControlled ? onOpenChange : setInternalOpen;

	return (
		<div className="flex shrink-0 flex-col border-t bg-muted/30">
			{showTrigger ? (
				<Button
					variant="ghost"
					className="flex h-10 w-full items-center justify-between gap-2 rounded-none px-3 py-2 hover:bg-muted/50"
					onClick={() => setOpen(!open)}
				>
					<span className="flex items-center gap-2 font-medium text-sm">
						<ListTodo className="size-4 text-muted-foreground" />
						Tasks
					</span>
					{open ? (
						<ChevronUp className="size-4 text-muted-foreground" />
					) : (
						<ChevronDown className="size-4 text-muted-foreground" />
					)}
				</Button>
			) : null}
			<div
				className={cn(
					"grid transition-[grid-template-rows] duration-200 ease-out",
					open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
			>
				<div className="min-h-0 overflow-hidden">
					<ScrollArea className="h-[180px] border-t">
						<div className="flex flex-col gap-1 p-2">
							{/* Placeholder mockup rows */}
							<div className="rounded-md border bg-background px-3 py-2 text-muted-foreground text-sm">
								Task list will go here (e.g. unscheduled or today’s tasks)
							</div>
							<div className="rounded-md border bg-background px-3 py-2 text-sm">
								<span className="font-medium">Example task 1</span>
								<span className="ml-2 text-muted-foreground text-xs">30m</span>
							</div>
							<div className="rounded-md border bg-background px-3 py-2 text-sm">
								<span className="font-medium">Example task 2</span>
								<span className="ml-2 text-muted-foreground text-xs">1h</span>
							</div>
						</div>
					</ScrollArea>
				</div>
			</div>
		</div>
	);
}
