import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { format } from "date-fns";
import { toast } from "sonner";

/** Use Convex’s FunctionArgs so you don’t have to manually type mutation payloads. */
export type UpdateEventPayload = FunctionArgs<typeof api.events.mutations.updateEvent>;

export type UpdateEventMutationOptions = {
	meta?: { updateType?: "drag" | "edit" };
};

const eventsQueryKey = convexQuery(api.events.queries.getEventsByUser).queryKey;

function patchEventsCache(prev: unknown, payload: UpdateEventPayload): unknown {
	if (!Array.isArray(prev)) {
		return prev;
	}
	const { id, ...patch } = payload;
	return prev.map((doc: Record<string, unknown>) =>
		doc._id === id ? { ...doc, ...patch } : doc,
	);
}

/**
 * useMutation for api.events.mutations.updateEvent with optimistic update of the
 * getEventsByUser query cache. Use this instead of raw useConvexMutation
 * so drag-and-drop and form updates feel instant.
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
			await queryClient.cancelQueries({ queryKey: eventsQueryKey });
			const previousData = queryClient.getQueryData(eventsQueryKey);
			queryClient.setQueryData(
				eventsQueryKey,
				patchEventsCache(previousData, payload),
			);
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
				return;
			} else {
				toast.success("Event updated successfully");
			}
			return { previousData };
		},
		onError: (_err, _payload, context) => {
			if (context?.previousData !== undefined) {
				queryClient.setQueryData(eventsQueryKey, context.previousData);
			}
			toast.error("Failed to update event on server");
		},
	});

	return mutation;
}
