"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export function RecurringEventEditDialog({
	open,
	onOpenChange,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (mode: "this" | "all") => void;
}) {
	const title = "Edit Recurring Event";
	const description =
		"This is part of a recurring series. How would you like to edit it?";
	const thisButtonText = "Edit this event only";
	const allButtonText = "Edit all future events";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Button
						variant="outline"
						onClick={() => {
							onConfirm("this");
							onOpenChange(false);
						}}
						className="w-full"
					>
						{thisButtonText}
					</Button>
					<Button
						variant="outline"
						onClick={() => {
							onConfirm("all");
							onOpenChange(false);
						}}
						className="w-full"
					>
						{allButtonText}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
