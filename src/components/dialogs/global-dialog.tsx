"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { dialogStore, useDialogStore } from "@/lib/dialog-store";
import { RecurringEventEditDialog } from "@/routes/_authenticated/calendar/-components/dialogs/recurring-event-edit-dialog";
import { useSelector } from "@xstate/store-react";

export function GlobalDialog() {
	const store = useDialogStore();

	const dialog = useSelector(store, (state) => state.context.dialog);

	if (!dialog) {
		return null;
	}

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			dialogStore.send({ type: "closeDialog" });
		}
	};

	if (dialog.type === "recurring-event") {
		return (
			<RecurringEventEditDialog
				open={true}
				onOpenChange={handleOpenChange}
				onConfirm={async (mode) => {
					await dialog.onConfirm(mode);
					dialogStore.send({ type: "closeDialog" });
				}}
			/>
		);
	}

	const handleConfirm = async () => {
		await dialog.onConfirm();
		dialogStore.send({ type: "closeDialog" });
	};

	const handleCancel = async () => {
		await dialog.onCancel?.();
		dialogStore.send({ type: "closeDialog" });
	};

	return (
		<Dialog open={true} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{dialog.data.title}</DialogTitle>
					<DialogDescription>{dialog.data.description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					{dialog.type === "confirm" && (
						<Button variant="outline" onClick={handleCancel}>
							{dialog.data.cancelText ?? "Cancel"}
						</Button>
					)}
					<Button onClick={handleConfirm}>
						{dialog.data.confirmText ??
							(dialog.type === "alert" ? "OK" : "Continue")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
