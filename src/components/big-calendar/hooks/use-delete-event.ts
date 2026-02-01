import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

export function useDeleteEvent() {
	const deleteEventMutation = useMutation(api.events.deleteEvent);

	const deleteEvent = async (eventId: Id<"events">) => {
		return await deleteEventMutation({ id: eventId });
	};

	return { deleteEvent };
}
