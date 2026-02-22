import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/** Payload for api.events.mutations.deleteEvent (Zod-validated args). */
export type DeleteEventPayload = { id: string };

/** Calendar UI reads from getEventsByDateRange, not getEventsByUser. */
const dateRangeQueryKeyPrefix = convexQuery(
	api.events.queries.getEventsByDateRange,
	{ startTimestamp: 0, endTimestamp: 0 },
).queryKey.slice(0, 2);

function removeEventFromCache(prev: unknown, id: string): unknown {
	if (!Array.isArray(prev)) {
		return prev;
	}
	return prev.filter((doc: Record<string, unknown>) => doc._id !== id);
}

/**
 * useMutation for api.events.mutations.deleteEvent with optimistic update of the
 * getEventsByDateRange query cache (used by the calendar). Use this instead of
 * raw useConvexMutation so the event disappears from the UI immediately.
 */
export function useDeleteEventMutation() {
	const queryClient = useQueryClient();
	const deleteEventFn = useConvexMutation(api.events.mutations.deleteEvent);

	const mutation = useMutation({
		mutationFn: deleteEventFn,
		onMutate: async (payload) => {
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
					removeEventFromCache(data, payload.id),
				);
			}
			toast.success("Event deleted");
			return { previousDataByKey };
		},
		onError: (_err, _payload, context) => {
			const entries = context?.previousDataByKey;
			if (Array.isArray(entries)) {
				for (const [queryKey, data] of entries) {
					queryClient.setQueryData([...queryKey] as unknown[], data);
				}
			}
			toast.error("Failed to delete event");
		},
	});

	return mutation;
}
