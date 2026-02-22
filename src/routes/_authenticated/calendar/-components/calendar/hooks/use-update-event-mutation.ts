import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { format } from "date-fns";
import { toast } from "sonner";

/** Use Convex’s FunctionArgs so you don’t have to manually type mutation payloads. */
export type UpdateEventPayload = FunctionArgs<
	typeof api.events.mutations.updateEvent
>;

export type UpdateEventMutationOptions = {
	meta?: { updateType?: "drag" | "edit" };
};

/** Calendar UI reads from getEventsByDateRange, not getEventsByUser. */
const dateRangeQueryKeyPrefix = convexQuery(
	api.events.queries.getEventsByDateRange,
	{ startTimestamp: 0, endTimestamp: 0 },
).queryKey.slice(0, 2);

function patchEventsCache(prev: unknown, payload: UpdateEventPayload): unknown {
	if (!Array.isArray(prev)) {
		return prev;
	}
	const { id, ...patch } = payload;
	return prev.map((doc: Record<string, unknown>) =>
		doc._id === id ? { ...doc, ...patch } : doc,
	);
}

/** Replace a doc in the cache with the full server doc (e.g. after update). */
function replaceInCacheWithServerDoc(
	prev: unknown,
	eventId: string,
	serverDoc: Record<string, unknown>,
): unknown {
	if (!Array.isArray(prev)) {
		return prev;
	}
	return prev.map((doc: Record<string, unknown>) =>
		doc._id === eventId ? serverDoc : doc,
	);
}

/**
 * useMutation for api.events.mutations.updateEvent with optimistic update of the
 * getEventsByDateRange query cache (used by the calendar). Use this instead of
 * raw useConvexMutation so drag-and-drop and form updates feel instant.
 */
export function useUpdateEventMutation(options: {
	meta: { updateType: "drag" | "edit" };
}) {
	const queryClient = useQueryClient();
	const updateEventFn = useConvexMutation(api.events.mutations.updateEvent);

	const mutation = useMutation({
		mutationFn: updateEventFn,
		meta: options.meta,
		onMutate: async (payload, context) => {
			await queryClient.cancelQueries({
				queryKey: dateRangeQueryKeyPrefix,
			});
			const allDateRangeEntries = queryClient.getQueriesData({
				queryKey: dateRangeQueryKeyPrefix,
			});
			const previousDataByKey: Array<readonly [readonly unknown[], unknown]> =
				[];
			for (const [queryKey, data] of allDateRangeEntries) {
				if (!Array.isArray(data)) {
					continue;
				}
				previousDataByKey.push([queryKey, data]);
				queryClient.setQueryData(
					[...queryKey] as unknown[],
					patchEventsCache(data, payload),
				);
			}
			if (context.meta?.updateType === "drag") {
				const start = payload.startTimestamp;
				const end = payload.endTimestamp;
				const startDateStr = payload.startDateStr;
				if (start != null || end != null) {
					const startDate =
						start != null
							? new Date(start)
							: end != null
								? new Date(end)
								: null;
					const endDate = end != null ? new Date(end) : null;
					if (startDate) {
						const dateStr = format(startDate, "EEE, MMM d");
						const timeStr =
							endDate && end !== start
								? `${format(startDate, "h:mm a")} – ${format(endDate, "h:mm a")}`
								: format(startDate, "h:mm a");
						toast.success(`Event scheduled for ${dateStr} at ${timeStr}`);
					}
				} else if (startDateStr) {
					const startDate = new Date(startDateStr + "T00:00:00");
					const dateStr = format(startDate, "EEE, MMM d");
					toast.success(`Event scheduled for ${dateStr}`);
				}
			} else {
				toast.success("Event updated successfully");
			}
			return { previousDataByKey };
		},
		onSuccess: (serverEvent, _payload) => {
			const eventId = (serverEvent as Record<string, unknown>)._id;
			if (eventId == null) {
				return;
			}
			const allDateRangeEntries = queryClient.getQueriesData({
				queryKey: dateRangeQueryKeyPrefix,
			});
			for (const [queryKey, data] of allDateRangeEntries) {
				if (!Array.isArray(data)) {
					continue;
				}
				const hasEvent = data.some(
					(doc: Record<string, unknown>) => doc._id === eventId,
				);
				if (!hasEvent) {
					continue;
				}
				queryClient.setQueryData(
					[...queryKey] as unknown[],
					replaceInCacheWithServerDoc(
						data,
						String(eventId),
						serverEvent as Record<string, unknown>,
					),
				);
			}
			// Invalidate so Convex live query refetches and UI shows resolved shape (e.g. color).
			// Avoids stale render when subscription had not yet pushed the updated result.
			queryClient.invalidateQueries({ queryKey: dateRangeQueryKeyPrefix });
		},
		onError: (_err, _payload, context) => {
			const entries = context?.previousDataByKey;
			if (Array.isArray(entries)) {
				for (const [queryKey, data] of entries) {
					queryClient.setQueryData([...queryKey] as unknown[], data);
				}
			}
			toast.error("Failed to update event on server");
		},
	});

	return mutation;
}
