"use client";

import { createStore } from "@xstate/store";
import { createContext, type ReactNode, useContext } from "react";

type DialogState =
	| {
			type: "alert";
			data: {
				title: string;
				description: string;
				confirmText?: string;
			};
			onConfirm: () => void | Promise<void>;
			onCancel?: undefined;
	  }
	| {
			type: "confirm";
			data: {
				title: string;
				description: string;
				confirmText?: string;
				cancelText?: string;
			};
			onConfirm: () => void | Promise<void>;
			onCancel?: () => void | Promise<void>;
	  }
	| {
			type: "recurring-event";
			data: Record<string, never>;
			onConfirm: (mode: "this" | "all") => void | Promise<void>;
			onCancel?: () => void | Promise<void>;
	  };

export const dialogStore = createStore({
	context: {
		dialog: null as DialogState | null,
	},
	on: {
		openAlertDialog: (
			context,
			event: {
				title: string;
				description: string;
				confirmText?: string;
				onConfirm?: () => void | Promise<void>;
			},
		) => ({
			...context,
			dialog: {
				type: "alert" as const,
				data: {
					title: event.title,
					description: event.description,
					confirmText: event.confirmText ?? "OK",
				},
				onConfirm: event.onConfirm ?? (() => {}),
				onCancel: undefined,
			},
		}),
		openConfirmDialog: (
			context,
			event: {
				title: string;
				description: string;
				confirmText?: string;
				cancelText?: string;
				onConfirm?: () => void | Promise<void>;
				onCancel?: () => void | Promise<void>;
			},
		) => ({
			...context,
			dialog: {
				type: "confirm" as const,
				data: {
					title: event.title,
					description: event.description,
					confirmText: event.confirmText ?? "Continue",
					cancelText: event.cancelText ?? "Cancel",
				},
				onConfirm: event.onConfirm ?? (() => {}),
				onCancel: event.onCancel,
			},
		}),
		openRecurringEventDialog: (
			context,
			event: {
				onConfirm: (mode: "this" | "all") => void | Promise<void>;
				onCancel?: () => void | Promise<void>;
			},
		) => ({
			...context,
			dialog: {
				type: "recurring-event" as const,
				data: {} as Record<string, never>,
				onConfirm: event.onConfirm,
				onCancel: event.onCancel,
			},
		}),
		closeDialog: () => ({
			dialog: null,
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
