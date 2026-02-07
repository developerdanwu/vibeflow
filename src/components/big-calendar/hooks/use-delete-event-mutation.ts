import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { toast } from "sonner";

export type DeleteEventPayload = FunctionArgs<typeof api.events.deleteEvent>;

const eventsQueryKey = convexQuery(api.events.getEventsByUser).queryKey;

function removeEventFromCache(prev: unknown, id: Id<"events">): unknown {
	if (!Array.isArray(prev)) {
		return prev;
	}
	return prev.filter((doc: Record<string, unknown>) => doc._id !== id);
}

/**
 * useMutation for api.events.deleteEvent with optimistic update of the
 * getEventsByUser query cache. Use this instead of raw useConvexMutation
 * so the event disappears from the UI immediately.
 */
export function useDeleteEventMutation() {
	const queryClient = useQueryClient();
	const deleteEventFn = useConvexMutation(api.events.deleteEvent);

	const mutation = useMutation({
		mutationFn: deleteEventFn,
		onMutate: async (payload) => {
			await queryClient.cancelQueries({ queryKey: eventsQueryKey });
			const previousData = queryClient.getQueryData(eventsQueryKey);
			queryClient.setQueryData(
				eventsQueryKey,
				removeEventFromCache(previousData, payload.id),
			);
			toast.success("Event deleted");
			return { previousData };
		},
		onError: (_err, _payload, context) => {
			if (context?.previousData !== undefined) {
				queryClient.setQueryData(eventsQueryKey, context.previousData);
			}
			toast.error("Failed to delete event");
		},
	});

	return mutation;
}
