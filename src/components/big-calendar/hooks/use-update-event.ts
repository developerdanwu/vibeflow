import { useMutation } from "convex/react";
import type { IEvent } from "@/components/big-calendar/interfaces";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

interface UpdateEventInput {
	id: string;
	title?: string;
	description?: string;
	startDate?: number;
	endDate?: number;
	color?: string;
	startDateStr?: string;
	endDateStr?: string;
	startTime?: string;
	endTime?: string;
	timeZone?: string;
	allDay?: boolean;
}

export function useUpdateEvent() {
	const updateEventMutation = useMutation(api.events.updateEvent);

	const updateEvent = async (input: UpdateEventInput | IEvent) => {
		if (!input.id) {
			throw new Error("Cannot update event without id");
		}

		const updatePayload: Record<string, unknown> = {
			id: input.id as Id<"events">,
		};

		if ("title" in input && input.title) {
			updatePayload.title = input.title;
		}
		if ("description" in input && input.description) {
			updatePayload.description = input.description;
		}
		if ("color" in input && input.color) {
			updatePayload.color = input.color;
		}

		if ("startDateStr" in input && input.startDateStr) {
			updatePayload.startDateStr = input.startDateStr;
		}
		if ("endDateStr" in input && input.endDateStr) {
			updatePayload.endDateStr = input.endDateStr;
		}
		if ("startTime" in input && input.startTime) {
			updatePayload.startTime = input.startTime;
		}
		if ("endTime" in input && input.endTime) {
			updatePayload.endTime = input.endTime;
		}
		if ("timeZone" in input && input.timeZone) {
			updatePayload.timeZone = input.timeZone;
		}
		if ("allDay" in input && input.allDay !== undefined) {
			updatePayload.allDay = input.allDay;
		}

		if ("startDate" in input && input.startDate) {
			updatePayload.startDate = input.startDate;
		}
		if ("endDate" in input && input.endDate) {
			updatePayload.endDate = input.endDate;
		}

		return await updateEventMutation(
			updatePayload as Parameters<typeof updateEventMutation>[0],
		);
	};

	return { updateEvent };
}
