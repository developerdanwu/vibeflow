"use client";

import { createStore } from "@xstate/store";
import { createContext, type ReactNode, useContext } from "react";

export const dialogStore = createStore({
	context: {
		isOpen: false,
		type: null as "alert" | "confirm" | null,
		title: "",
		description: "",
		confirmText: "OK",
		cancelText: "Cancel",
		onConfirm: undefined as (() => void | Promise<void>) | undefined,
		onCancel: undefined as (() => void | Promise<void>) | undefined,
	},
	on: {
		openAlertDialog: (
			context,
			event: {
				title: string;
				description: string;
				confirmText?: string;
				onConfirm?: () => void;
			},
		) => ({
			...context,
			isOpen: true,
			type: "alert" as const,
			title: event.title,
			description: event.description,
			confirmText: event.confirmText ?? "OK",
			onConfirm: event.onConfirm,
			onCancel: undefined,
		}),
		openConfirmDialog: (
			context,
			event: {
				title: string;
				description: string;
				confirmText?: string;
				cancelText?: string;
				onConfirm?: () => void;
				onCancel?: () => void;
			},
		) => ({
			...context,
			isOpen: true,
			type: "confirm" as const,
			title: event.title,
			description: event.description,
			confirmText: event.confirmText ?? "Continue",
			cancelText: event.cancelText ?? "Cancel",
			onConfirm: event.onConfirm,
			onCancel: event.onCancel,
		}),
		closeDialog: () => ({
			isOpen: false,
			type: null as "alert" | "confirm" | null,
			title: "",
			description: "",
			confirmText: "OK",
			cancelText: "Cancel",
			onConfirm: undefined,
			onCancel: undefined,
		}),
	},
});

const DialogStoreContext = createContext(dialogStore);

export function DialogStoreProvider({ children }: { children: ReactNode }) {
	return (
		<DialogStoreContext.Provider value={dialogStore}>
			{children}
		</DialogStoreContext.Provider>
	);
}

export function useDialogStore() {
	const store = useContext(DialogStoreContext);
	if (!store) {
		throw new Error("useDialogStore must be used within a DialogStoreProvider");
	}
	return store;
}
