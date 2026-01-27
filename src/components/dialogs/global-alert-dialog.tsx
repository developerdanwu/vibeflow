"use client";

import { useSelector } from "@xstate/store-react";
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

export function GlobalAlertDialog() {
	const store = useDialogStore();

	const isOpen = useSelector(store, (state) => state.context.isOpen);
	const type = useSelector(store, (state) => state.context.type);
	const title = useSelector(store, (state) => state.context.title);
	const description = useSelector(store, (state) => state.context.description);
	const confirmText = useSelector(store, (state) => state.context.confirmText);
	const cancelText = useSelector(store, (state) => state.context.cancelText);
	const onConfirm = useSelector(store, (state) => state.context.onConfirm);
	const onCancel = useSelector(store, (state) => state.context.onCancel);

	const handleConfirm = () => {
		onConfirm?.();
		dialogStore.send({ type: "closeDialog" });
	};

	const handleCancel = () => {
		onCancel?.();
		dialogStore.send({ type: "closeDialog" });
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			dialogStore.send({ type: "closeDialog" });
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					{type === "confirm" && (
						<Button variant="outline" onClick={handleCancel}>
							{cancelText}
						</Button>
					)}
					<Button onClick={handleConfirm}>{confirmText}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
