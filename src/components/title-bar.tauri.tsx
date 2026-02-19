import { isTauri } from "@/lib/tauri";
import type { ReactNode } from "react";

/**
 * Tauri-only title bar that sits next to the native macOS traffic lights.
 * Uses titleBarStyle: "Overlay" so system close/minimize/maximize stay; this bar
 * has left padding to avoid overlapping them. Add any custom content as children.
 */
export function TitleBar({
	leftContent,
	rightContent,
}: {
	leftContent?: ReactNode;
	rightContent?: ReactNode;
	children?: ReactNode;
}) {
	if (!isTauri()) {
		return null;
	}

	return (
		<div className="flex h-10 shrink-0 items-center gap-2 bg-sidebar pr-2 pl-20">
			<div>{leftContent}</div>
			<div className="h-full flex-1" data-tauri-drag-region />
			{/* Space on the left is reserved for native traffic lights (Overlay mode) */}
			<div>{rightContent}</div>
		</div>
	);
}
