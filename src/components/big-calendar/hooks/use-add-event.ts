import { useMutation } from "convex/react";
import type { TEventFormData } from "@/components/big-calendar/schemas";
import { api } from "../../../../convex/_generated/api";

export function useAddEvent() {
	const createEvent = useMutation(api.events.createEvent);

	const addEvent = async (formData: TEventFormData) => {
		const startDateTime = new Date(formData.startDate);
		startDateTime.setHours(
			formData.startTime.hour,
			formData.startTime.minute,
			0,
			0,
		);

		const endDateTime = new Date(formData.endDate);
		endDateTime.setHours(formData.endTime.hour, formData.endTime.minute, 0, 0);

		return await createEvent({
			title: formData.title,
			description: formData.description,
			startDate: startDateTime.getTime(),
			endDate: endDateTime.getTime(),
			color: formData.color,
			allDay: false,
		});
	};

	return { addEvent };
}
