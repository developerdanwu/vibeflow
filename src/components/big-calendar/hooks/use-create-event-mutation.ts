import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { toast } from "sonner";

export type CreateEventPayload = FunctionArgs<typeof api.events.mutations.createEvent>;

const eventsQueryKey = convexQuery(api.events.queries.getEventsByUser).queryKey;

const TEMP_ID_PREFIX = "temp-";

function addEventToCache(
	prev: unknown,
	tempDoc: Record<string, unknown>,
): unknown {
	if (!Array.isArray(prev)) {
		return prev;
	}
	return [...prev, tempDoc];
}

function buildTempDoc(
	payload: CreateEventPayload,
	userId: Id<"users">,
	tempId: string,
): Record<string, unknown> {
	let startTimestamp: number;
	let endTimestamp: number;
	if (payload.startTimestamp != null && payload.endTimestamp != null) {
		startTimestamp = payload.startTimestamp;
		endTimestamp = payload.endTimestamp;
	} else if (payload.allDay && payload.startDateStr && payload.endDateStr) {
		startTimestamp = new Date(payload.startDateStr + "T00:00:00Z").getTime();
		endTimestamp = new Date(payload.endDateStr + "T00:00:00Z").getTime();
	} else {
		startTimestamp = 0;
		endTimestamp = 0;
	}
	return {
		_id: tempId,
		...payload,
		startTimestamp,
		endTimestamp,
		userId,
	};
}

/**
 * useMutation for api.events.mutations.createEvent with optimistic update of the
 * getEventsByUser query cache. Use this instead of raw useConvexMutation
 * so the new event appears in the UI immediately.
 */
export function useCreateEventMutation() {
	const queryClient = useQueryClient();
	const createEventFn = useConvexMutation(api.events.mutations.createEvent);

	const mutation = useMutation({
		mutationFn: createEventFn,
		onMutate: async (payload) => {
			await queryClient.cancelQueries({ queryKey: eventsQueryKey });
			const previousData = queryClient.getQueryData(eventsQueryKey);
			const tempId = `${TEMP_ID_PREFIX}${Date.now()}`;
			const userId =
				Array.isArray(previousData) && previousData.length > 0
					? ((previousData[0] as Record<string, unknown>).userId as
							| Id<"users">
							| undefined)
					: undefined;
			if (userId !== undefined) {
				const tempDoc = buildTempDoc(payload, userId, tempId);
				queryClient.setQueryData(
					eventsQueryKey,
					addEventToCache(previousData, tempDoc),
				);
			}
			toast.success("Event created");
			return { previousData, tempId };
		},
		onError: (_err, _payload, context) => {
			if (context?.previousData !== undefined) {
				queryClient.setQueryData(eventsQueryKey, context.previousData);
			}
			toast.error("Failed to create event");
		},
	});

	return mutation;
}
