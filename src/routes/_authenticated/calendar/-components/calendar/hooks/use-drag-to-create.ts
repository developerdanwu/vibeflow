import { useMotionValue } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

// --- Slot types ---

export interface Slot {
	hour: number;
	minute: number;
}

export interface SlotRange {
	startSlot: Slot;
	endSlot: Slot;
}

// --- Helpers ---

const DEFAULT_SLOT_HEIGHT_PX = 24;
const DEFAULT_MIN_DISTANCE = 5;
const DEFAULT_DURATION_SLOTS = 1; // 1 slot = 15 min

function slotFromClientY(
	clientY: number,
	gridEl: HTMLDivElement,
	firstHour: number,
	slotHeightPx: number,
): Slot {
	const rect = gridEl.getBoundingClientRect();
	const offsetY = Math.max(0, Math.min(clientY - rect.top, rect.height - 1));
	const totalSlots = Math.floor(offsetY / slotHeightPx);
	const absoluteSlot = firstHour * 4 + totalSlots;
	const hour = Math.min(Math.floor(absoluteSlot / 4), 23);
	const minute = Math.min((absoluteSlot % 4) * 15, 45);
	return { hour, minute };
}

function slotToIndex(slot: Slot): number {
	return slot.hour * 4 + slot.minute / 15;
}

// --- Hook options ---

interface UseDragToCreateOptions {
	gridRef: React.RefObject<HTMLDivElement | null>;
	firstHour: number;
	slotHeightPx?: number;
	minDistance?: number;
	defaultDurationSlots?: number;
	onDragEnd: (range: SlotRange) => void;
	onClick: (slot: Slot) => void;
}

interface UseDragToCreateReturn {
	isDragging: boolean;
	dragPreview: SlotRange | null;
	topValue: ReturnType<typeof useMotionValue<number>>;
	heightValue: ReturnType<typeof useMotionValue<number>>;
	getSlotProps: (
		hour: number,
		minute: number,
	) => {
		onPointerDown: (e: React.PointerEvent) => void;
	};
}

// --- Hook ---

export function useDragToCreate(
	options: UseDragToCreateOptions,
): UseDragToCreateReturn {
	const slotHeightPx = options.slotHeightPx ?? DEFAULT_SLOT_HEIGHT_PX;
	const minDistance = options.minDistance ?? DEFAULT_MIN_DISTANCE;
	const defaultDurationSlots =
		options.defaultDurationSlots ?? DEFAULT_DURATION_SLOTS;

	// Keep latest options in refs so event listeners always read current values
	const optionsRef = useRef(options);
	optionsRef.current = options;

	// --- State ---
	// `dragPreview` triggers re-render for visual preview
	const [dragPreview, setDragPreview] = useState<SlotRange | null>(null);

	// --- Refs (no re-renders during drag) ---
	const originSlotRef = useRef<Slot | null>(null);
	const dragPreviewRef = useRef<SlotRange | null>(null);
	const isDraggingRef = useRef(false);
	const startYRef = useRef(0);

	// Ref to hold the function that removes document listeners
	const cleanupListenersRef = useRef<(() => void) | null>(null);

	// --- Motion values (no re-renders) ---
	const topValue = useMotionValue(0);
	const heightValue = useMotionValue(slotHeightPx);

	// --- Cleanup helper ---
	const cleanup = () => {
		// Remove document listeners first
		cleanupListenersRef.current?.();
		cleanupListenersRef.current = null;

		originSlotRef.current = null;
		dragPreviewRef.current = null;
		isDraggingRef.current = false;
		startYRef.current = 0;
		setDragPreview(null);
	};

	// --- Handler refs (stable references for document listeners) ---
	const handleMoveRef = useRef<(e: PointerEvent) => void>(() => {});
	const handleUpRef = useRef<() => void>(() => {});
	const handleCancelRef = useRef<() => void>(() => {});

	// Update handler refs on every render — cheap, no re-render triggered
	handleMoveRef.current = (e: PointerEvent) => {
		if (!originSlotRef.current) {
			return;
		}

		// Check threshold
		const deltaY = Math.abs(e.clientY - startYRef.current);
		if (!isDraggingRef.current && deltaY > minDistance) {
			isDraggingRef.current = true;
		}

		// Update drag preview if threshold exceeded
		if (!isDraggingRef.current) {
			return;
		}

		const gridEl = optionsRef.current.gridRef.current;
		if (!gridEl) {
			return;
		}

		const slot = slotFromClientY(
			e.clientY,
			gridEl,
			optionsRef.current.firstHour,
			slotHeightPx,
		);
		const originIdx = slotToIndex(originSlotRef.current);
		const curIdx = slotToIndex(slot);
		const minIdx = Math.min(originIdx, curIdx);
		const maxIdx = Math.max(originIdx, curIdx);

		const startH = Math.floor(minIdx / 4);
		const startM = (minIdx % 4) * 15;
		const endPlusOne = maxIdx + 1;
		const endH = Math.floor(endPlusOne / 4);
		const endM = (endPlusOne % 4) * 15;

		const preview: SlotRange = {
			startSlot: { hour: startH, minute: startM },
			endSlot: { hour: endH, minute: endM },
		};
		dragPreviewRef.current = preview;
		setDragPreview(preview);

		// Update motion values
		const startIdx = minIdx;
		const endIdx = maxIdx;
		topValue.set(startIdx * slotHeightPx);
		heightValue.set(
			Math.max(slotHeightPx, (endIdx - startIdx + 1) * slotHeightPx),
		);
	};

	handleUpRef.current = () => {
		const wasDragging = isDraggingRef.current;
		const origin = originSlotRef.current;
		const finalPreview = dragPreviewRef.current;

		if (wasDragging && finalPreview) {
			// Drag completed — sync motion values to final range
			const startIdx = slotToIndex(finalPreview.startSlot);
			const endIdx = slotToIndex(finalPreview.endSlot);
			topValue.set(startIdx * slotHeightPx);
			heightValue.set(
				Math.max(slotHeightPx, (endIdx - startIdx) * slotHeightPx),
			);
			cleanup();
			optionsRef.current.onDragEnd(finalPreview);
		} else if (origin) {
			// Click — set default duration and sync motion values
			const originIdx = slotToIndex(origin);
			topValue.set(originIdx * slotHeightPx);
			heightValue.set(defaultDurationSlots * slotHeightPx);
			cleanup();
			optionsRef.current.onClick(origin);
		} else {
			cleanup();
		}

		// Suppress the stale `click` event the browser fires after pointerup/mouseup.
		// On desktop (mouse input), preventDefault on pointerdown does NOT prevent
		// the mousedown → mouseup → click chain. Without this, base-ui's dismiss
		// layer picks up the click as "click outside" and immediately closes the
		// popover we just opened.
		const stopNextClick = (e: MouseEvent) => {
			e.stopPropagation();
		};
		document.addEventListener("click", stopNextClick, {
			capture: true,
			once: true,
		});
	};

	handleCancelRef.current = () => {
		cleanup();
	};

	// --- Safety: clean up listeners on unmount ---
	useEffect(() => {
		return () => {
			cleanupListenersRef.current?.();
			cleanupListenersRef.current = null;
		};
	}, []);

	// --- Attach listeners synchronously ---
	const attachListeners = () => {
		// Remove any existing listeners first (safety)
		cleanupListenersRef.current?.();

		const onMove = (e: PointerEvent) => handleMoveRef.current(e);
		const onUp = () => handleUpRef.current();
		const onCancel = () => handleCancelRef.current();

		document.addEventListener("pointermove", onMove);
		document.addEventListener("pointerup", onUp);
		document.addEventListener("pointercancel", onCancel);

		cleanupListenersRef.current = () => {
			document.removeEventListener("pointermove", onMove);
			document.removeEventListener("pointerup", onUp);
			document.removeEventListener("pointercancel", onCancel);
		};
	};

	// --- Slot props factory ---
	const getSlotProps = (hour: number, minute: number) => ({
		onPointerDown: (e: React.PointerEvent) => {
			// Only handle primary pointer button
			if (e.button !== 0) {
				return;
			}

			e.preventDefault(); // Prevent text selection

			// Reset drag state
			isDraggingRef.current = false;
			startYRef.current = e.clientY;
			originSlotRef.current = { hour, minute };
			dragPreviewRef.current = null;
			setDragPreview(null);

			// Set initial position (motion values)
			const topPx = (hour * 4 + minute / 15) * slotHeightPx;
			topValue.set(topPx);
			heightValue.set(slotHeightPx);

			// Attach document listeners synchronously so pointerup/pointermove
			// are captured immediately, without waiting for a React render cycle
			attachListeners();
		},
	});

	return {
		isDragging: isDraggingRef.current,
		dragPreview,
		topValue,
		heightValue,
		getSlotProps,
	};
}
