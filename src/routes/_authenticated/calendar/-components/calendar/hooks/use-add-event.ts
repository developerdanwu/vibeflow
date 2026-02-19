import type { TEventFormData } from "@/routes/_authenticated/calendar/-components/calendar/core/schemas";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { set, startOfDay } from "date-fns";

export function useAddEvent() {
	const createEvent = useMutation(api.events.mutations.createEvent);

	const addEvent = async (formData: TEventFormData) => {
		const startDateTime = set(startOfDay(formData.startDate), {
			hours: formData.startTime.hour,
			minutes: formData.startTime.minute,
			seconds: 0,
			milliseconds: 0,
		});
		const endDateTime = set(startOfDay(formData.endDate), {
			hours: formData.endTime.hour,
			minutes: formData.endTime.minute,
			seconds: 0,
			milliseconds: 0,
		});

		return await createEvent({
			title: formData.title,
			description: formData.description,
			startTimestamp: startDateTime.getTime(),
			endTimestamp: endDateTime.getTime(),
			color: formData.color,
			allDay: false,
		});
	};

	return { addEvent };
}
