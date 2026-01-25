import { useMutation } from "convex/react";
import type { IEvent } from "@/components/big-calendar/interfaces";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function useUpdateEvent() {
	const updateEventMutation = useMutation(api.events.updateEvent);

	const updateEvent = async (event: IEvent) => {
		if (!event.convexId) {
			throw new Error("Cannot update event without convexId");
		}

		const startDate = new Date(event.startDate).getTime();
		const endDate = new Date(event.endDate).getTime();

		return await updateEventMutation({
			id: event.convexId as Id<"events">,
			title: event.title,
			description: event.description,
			startDate,
			endDate,
			color: event.color,
		});
	};

	return { updateEvent };
}
