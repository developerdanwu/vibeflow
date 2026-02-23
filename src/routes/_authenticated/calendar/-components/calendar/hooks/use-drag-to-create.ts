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

const SLOTS_PER_HOUR = 4;
const SLOTS_PER_DAY = 24 * SLOTS_PER_HOUR; // 96
const DEFAULT_SLOT_HEIGHT_PX = 24;
const DEFAULT_MIN_DISTANCE = 5;
const DEFAULT_DURATION_SLOTS = 1; // 1 slot = 15 min

function slotFromClientY(
	clientY: number,
	rowMap: Map<number, HTMLDivElement>,
	firstHour: number,
): Slot {
	const sortedHours = [...rowMap.keys()].sort((a, b) => a - b);
	if (sortedHours.length === 0) {
		return { hour: firstHour, minute: 0 };
	}
	const firstRowHour = sortedHours[0];
	const lastRowHour = sortedHours[sortedHours.length - 1];
	const firstEl = rowMap.get(firstRowHour);
	const lastEl = rowMap.get(lastRowHour);
	if (!firstEl || !lastEl) {
		return { hour: firstHour, minute: 0 };
	}
	const firstRect = firstEl.getBoundingClientRect();
	const lastRect = lastEl.getBoundingClientRect();
	if (clientY < firstRect.top) {
		return { hour: firstRowHour, minute: 0 };
	}
	if (clientY >= lastRect.bottom) {
		return { hour: lastRowHour, minute: 45 };
	}
	for (const hour of sortedHours) {
		const el = rowMap.get(hour);
		if (!el) continue;
		const rect = el.getBoundingClientRect();
		if (clientY >= rect.top && clientY < rect.bottom) {
			const offsetInRow = clientY - rect.top;
			const slotInRow = Math.min(
				SLOTS_PER_HOUR - 1,
				Math.max(
					0,
					Math.floor(offsetInRow / (rect.height / SLOTS_PER_HOUR)),
				),
			);
			return { hour, minute: slotInRow * 15 };
		}
	}
	return { hour: lastRowHour, minute: 45 };
}

function slotToIndex(slot: Slot): number {
	return slot.hour * SLOTS_PER_HOUR + slot.minute / 15;
}

function indexToSlot(index: number): Slot {
	const hour = Math.min(Math.floor(index / SLOTS_PER_HOUR), 23);
	const minute = Math.min((index % SLOTS_PER_HOUR) * 15, 45);
	return { hour, minute };
}

/** Returns preview top (px from grid top) and height (px) using row rects, or null if unavailable. */
function getPreviewRectFromRows(
	startSlot: Slot,
	endSlot: Slot,
	rowMap: Map<number, HTMLDivElement>,
	gridEl: HTMLDivElement | null,
): { topPx: number; heightPx: number } | null {
	if (!gridEl || rowMap.size === 0) return null;
	const gridRect = gridEl.getBoundingClientRect();
	const startRow = rowMap.get(startSlot.hour);
	if (!startRow) return null;
	const startRect = startRow.getBoundingClientRect();
	const slotHeightInRow = startRect.height / SLOTS_PER_HOUR;
	const startOffsetInRow = (startSlot.minute / 15) * slotHeightInRow;
	const topPx = startRect.top - gridRect.top + startOffsetInRow;
	// endSlot is exclusive; last inclusive slot is endSlot - 15min
	const lastSlot: Slot =
		endSlot.minute === 0
			? { hour: endSlot.hour - 1, minute: 45 }
			: { hour: endSlot.hour, minute: endSlot.minute - 15 };
	if (lastSlot.hour < 0) return null;
	const endRow = rowMap.get(lastSlot.hour);
	if (!endRow) return null;
	const endRect = endRow.getBoundingClientRect();
	const lastSlotHeightInRow = endRect.height / SLOTS_PER_HOUR;
	const endOffsetInRow =
		((lastSlot.minute / 15) + 1) * lastSlotHeightInRow;
	const bottomPx = endRect.top - gridRect.top + endOffsetInRow;
	const heightPx = Math.max(slotHeightInRow, bottomPx - topPx);
	return { topPx, heightPx };
}

function applyPreviewPosition(
	startSlot: Slot,
	endSlot: Slot,
	rowMap: Map<number, HTMLDivElement>,
	gridEl: HTMLDivElement | null,
	topValue: { set: (n: number) => void },
	heightValue: { set: (n: number) => void },
	slotHeightPx: number,
	fallbackTopIdx: number,
	fallbackHeightSlots: number,
): void {
	const rect = getPreviewRectFromRows(
		startSlot,
		endSlot,
		rowMap,
		gridEl,
	);
	if (rect) {
		topValue.set(rect.topPx);
		heightValue.set(rect.heightPx);
	} else {
		topValue.set(fallbackTopIdx * slotHeightPx);
		heightValue.set(
			Math.max(slotHeightPx, fallbackHeightSlots * slotHeightPx),
		);
	}
}

// --- Hook options ---

interface UseDragToCreateOptions {
	/** Used to compute preview position/height from row rects (grid-relative). */
	gridRef: React.RefObject<HTMLDivElement | null>;
	firstHour: number;
	/** Map of hour -> row DOM element for measure-on-the-fly slot resolution. */
	hourRowRefsRef: React.RefObject<Map<number, HTMLDivElement> | null>;
	slotHeightPx?: number;
	minDistance?: number;
	defaultDurationSlots?: number;
	/** Min number of 15-min slots in a drag range (default 1). */
	minDurationSlots?: number;
	/** Max number of 15-min slots in a drag range (default unlimited). */
	maxDurationSlots?: number;
	onDragEnd: (range: SlotRange) => void;
	onClick: (slot: Slot) => void;
}

interface UseDragToCreateReturn {
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
	const defaultDurationSlots =
		options.defaultDurationSlots ?? DEFAULT_DURATION_SLOTS;

	// Keep latest options in refs so event listeners always read current values
	const optionsRef = useRef(options);
	optionsRef.current = options;

	// --- State ---
	const [dragPreview, setDragPreview] = useState<SlotRange | null>(null);

	// --- Refs (no re-renders during drag) ---
	/** Set on pointer down, cleared on up/cancel/cleanup. */
	const pointerDownRef = useRef<{ origin: Slot; startY: number } | null>(null);
	const dragPreviewRef = useRef<SlotRange | null>(null);
	const captureTargetRef = useRef<Element | null>(null);
	const rafIdRef = useRef<number | null>(null);

	const cleanupListenersRef = useRef<(() => void) | null>(null);

	// --- Motion values (no re-renders) ---
	const topValue = useMotionValue(0);
	const heightValue = useMotionValue(slotHeightPx);

	// --- Cleanup helper ---
	const cleanup = () => {
		cleanupListenersRef.current?.();
		cleanupListenersRef.current = null;

		if (captureTargetRef.current) {
			captureTargetRef.current = null;
		}
		if (rafIdRef.current !== null) {
			cancelAnimationFrame(rafIdRef.current);
			rafIdRef.current = null;
		}

		pointerDownRef.current = null;
		dragPreviewRef.current = null;
		setDragPreview(null);
	};

	// --- Handler refs (stable references for document listeners) ---
	const handleMoveRef = useRef<(e: PointerEvent) => void>(() => {});
	const handleUpRef = useRef<(e: PointerEvent) => void>(() => {});
	const handleCancelRef = useRef<(e: PointerEvent) => void>(() => {});

	const releaseCapture = (e: PointerEvent) => {
		if (captureTargetRef.current) {
			try {
				captureTargetRef.current.releasePointerCapture(e.pointerId);
			} catch {
				// Ignore if already released
			}
			captureTargetRef.current = null;
		}
	};

	handleMoveRef.current = (e: PointerEvent) => {
		const down = pointerDownRef.current;
		if (!down) return;

		const opts = optionsRef.current;
		const deltaY = Math.abs(e.clientY - down.startY);
		const hasCrossedThreshold =
			dragPreviewRef.current !== null ||
			deltaY > (opts.minDistance ?? DEFAULT_MIN_DISTANCE);
		if (!hasCrossedThreshold) return;

		if (rafIdRef.current !== null) return;
		rafIdRef.current = requestAnimationFrame(() => {
			rafIdRef.current = null;
			const optsInner = optionsRef.current;
			const rowMap = optsInner.hourRowRefsRef.current ?? new Map();
			const slot = slotFromClientY(e.clientY, rowMap, optsInner.firstHour);
			const origin = pointerDownRef.current?.origin;
			if (!origin) return;
			const slotHeightPx =
				optsInner.slotHeightPx ?? DEFAULT_SLOT_HEIGHT_PX;
			const minDurationSlots = optsInner.minDurationSlots ?? 1;
			const maxDurationSlots =
				optsInner.maxDurationSlots ?? Number.POSITIVE_INFINITY;
			const originIdx = slotToIndex(origin);
			const curIdx = slotToIndex(slot);
			const rangeSize = Math.max(
				minDurationSlots,
				Math.min(
					maxDurationSlots,
					Math.abs(curIdx - originIdx) + 1,
				),
			);
			const minIdx =
				curIdx >= originIdx ? originIdx : originIdx - rangeSize + 1;
			const maxIdx =
				curIdx >= originIdx ? originIdx + rangeSize - 1 : originIdx;

			const startH = Math.floor(minIdx / SLOTS_PER_HOUR);
			const startM = (minIdx % SLOTS_PER_HOUR) * 15;
			const endPlusOne = maxIdx + 1;
			const endH = Math.floor(endPlusOne / SLOTS_PER_HOUR);
			const endM = (endPlusOne % SLOTS_PER_HOUR) * 15;

			const preview: SlotRange = {
				startSlot: { hour: startH, minute: startM },
				endSlot: { hour: endH, minute: endM },
			};
			dragPreviewRef.current = preview;
			setDragPreview(preview);

			applyPreviewPosition(
				preview.startSlot,
				preview.endSlot,
				rowMap,
				optsInner.gridRef.current,
				topValue,
				heightValue,
				slotHeightPx,
				minIdx,
				maxIdx - minIdx + 1,
			);
		});
	};

	handleUpRef.current = (e: PointerEvent) => {
		releaseCapture(e);

		const finalPreview = dragPreviewRef.current;
		const origin = pointerDownRef.current?.origin;
		const wasDragging = finalPreview !== null;
		const opts = optionsRef.current;
		const rowMap = opts.hourRowRefsRef.current ?? new Map();
		const gridEl = opts.gridRef.current;
		const slotHeightPx = opts.slotHeightPx ?? DEFAULT_SLOT_HEIGHT_PX;
		const defaultDurationSlots =
			opts.defaultDurationSlots ?? DEFAULT_DURATION_SLOTS;

		if (wasDragging && finalPreview) {
			const startIdx = slotToIndex(finalPreview.startSlot);
			const endIdx = slotToIndex(finalPreview.endSlot);
			applyPreviewPosition(
				finalPreview.startSlot,
				finalPreview.endSlot,
				rowMap,
				gridEl,
				topValue,
				heightValue,
				slotHeightPx,
				startIdx,
				endIdx - startIdx,
			);
			cleanup();
			opts.onDragEnd(finalPreview);
		} else if (origin) {
			const originIdx = slotToIndex(origin);
			const endIdx = originIdx + defaultDurationSlots;
			if (endIdx < SLOTS_PER_DAY) {
				applyPreviewPosition(
					origin,
					indexToSlot(endIdx),
					rowMap,
					gridEl,
					topValue,
					heightValue,
					slotHeightPx,
					originIdx,
					defaultDurationSlots,
				);
			} else {
				topValue.set(originIdx * slotHeightPx);
				heightValue.set(defaultDurationSlots * slotHeightPx);
			}
			cleanup();
			opts.onClick(origin);
		} else {
			cleanup();
		}

		const stopNextClick = (ev: MouseEvent) => {
			ev.stopPropagation();
		};
		document.addEventListener("click", stopNextClick, {
			capture: true,
			once: true,
		});
	};

	handleCancelRef.current = (e: PointerEvent) => {
		releaseCapture(e);
		cleanup();
	};

	// --- Safety: clean up listeners and refs on unmount (no setState to avoid update on unmounted component) ---
	useEffect(() => {
		return () => {
			cleanupListenersRef.current?.();
			cleanupListenersRef.current = null;
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}
			pointerDownRef.current = null;
			dragPreviewRef.current = null;
			captureTargetRef.current = null;
		};
	}, []);

	// --- Attach listeners synchronously ---
	const attachListeners = () => {
		// Remove any existing listeners first (safety)
		cleanupListenersRef.current?.();

		const onMove = (e: PointerEvent) => handleMoveRef.current(e);
		const onUp = (e: PointerEvent) => handleUpRef.current(e);
		const onCancel = (e: PointerEvent) => handleCancelRef.current(e);

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

			captureTargetRef.current = e.currentTarget;
			e.currentTarget.setPointerCapture(e.pointerId);

			pointerDownRef.current = { origin: { hour, minute }, startY: e.clientY };
			dragPreviewRef.current = null;
			setDragPreview(null);

			const rowMap = optionsRef.current.hourRowRefsRef.current ?? new Map();
			const gridEl = optionsRef.current.gridRef.current;
			const startSlot = { hour, minute };
			const startIdx = hour * SLOTS_PER_HOUR + minute / 15;
			const endIdx = startIdx + defaultDurationSlots;
			if (endIdx < SLOTS_PER_DAY) {
				applyPreviewPosition(
					startSlot,
					indexToSlot(endIdx),
					rowMap,
					gridEl,
					topValue,
					heightValue,
					slotHeightPx,
					startIdx,
					1,
				);
			} else {
				topValue.set(startIdx * slotHeightPx);
				heightValue.set(slotHeightPx);
			}

			attachListeners();
		},
	});

	return {
		dragPreview,
		topValue,
		heightValue,
		getSlotProps,
	};
}
