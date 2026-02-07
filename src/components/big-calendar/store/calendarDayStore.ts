import { createStoreHook } from "@xstate/store-react";

export type ResizePreview = {
	eventId: string;
	edge: "top" | "bottom";
	slotStartTimestamp: number;
} | null;

/** When moving an event over time blocks, the range that would be occupied (for drop preview ring). */
export type MoveDropRange = {
	startTimestamp: number;
	endTimestamp: number;
} | null;

export const useCalendarDay = createStoreHook({
	context: {
		resizePreview: null as ResizePreview,
		moveDropRange: null as MoveDropRange,
	},
	on: {
		setResizePreview: (context, event: { preview: ResizePreview }) => ({
			...context,
			resizePreview: event.preview,
		}),
		setMoveDropRange: (context, event: { range: MoveDropRange }) => ({
			...context,
			moveDropRange: event.range,
		}),
	},
});
