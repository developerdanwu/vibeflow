import type { TUser } from "@/routes/_authenticated/calendar/-components/big-calendar/core/interfaces";
import type {
	TBadgeVariant,
	TVisibleHours,
	TWorkingHours,
} from "@/routes/_authenticated/calendar/-components/big-calendar/core/types";
import type { Time } from "@internationalized/date";
import { createStoreHook } from "@xstate/store-react";

const WORKING_HOURS: TWorkingHours = {
	0: { from: 0, to: 0 },
	1: { from: 8, to: 17 },
	2: { from: 8, to: 17 },
	3: { from: 8, to: 17 },
	4: { from: 8, to: 17 },
	5: { from: 8, to: 17 },
	6: { from: 8, to: 12 },
};

const VISIBLE_HOURS: TVisibleHours = { from: 7, to: 18 };

export const useCalendar = createStoreHook({
	context: {
		sidebarOpen: false,
		visibleHours: VISIBLE_HOURS,
		newEventTitle: "",
		newEventDescription: "",
		workingHours: WORKING_HOURS,
		badgeVariant: "colored" as TBadgeVariant,
		newEventStartTime: null as Time | null | undefined,
		newEventEndTime: null as Time | null | undefined,
		newEventAllDay: true as boolean | undefined,
		selectedUserId: "all" as TUser["id"] | "all",
	},
	on: {
		openSidebar: (context) => ({
			...context,
			sidebarOpen: true,
		}),
		closeSidebar: (context) => ({
			...context,
			sidebarOpen: false,
		}),
		resetNewEvent: (context) => ({
			...context,
			newEventTitle: "",
			newEventDescription: "",
			newEventStartTime: null,
			newEventEndTime: null,
			newEventAllDay: true,
		}),
		setNewEventDescription: (context, event: { description: string }) => ({
			...context,
			newEventDescription: event.description,
		}),
		setNewEventStartTime: (
			context,
			event: { startTime: Time | null | undefined },
		) => ({
			...context,
			newEventStartTime: event.startTime,
		}),
		setNewEventEndTime: (
			context,
			event: { endTime: Time | null | undefined },
		) => ({
			...context,
			newEventEndTime: event.endTime,
		}),
		setNewEventAllDay: (context, event: { allDay: boolean | undefined }) => ({
			...context,
			newEventAllDay: event.allDay,
		}),
		setNewEventTitle: (context, event: { title: string }) => ({
			...context,
			newEventTitle: event.title,
		}),
		setSelectedUserId: (context, event: { userId: TUser["id"] | "all" }) => ({
			...context,
			selectedUserId: event.userId,
		}),
		setBadgeVariant: (context, event: { variant: TBadgeVariant }) => ({
			...context,
			badgeVariant: event.variant,
		}),
		setVisibleHours: (context, event: { hours: TVisibleHours }) => ({
			...context,
			visibleHours: event.hours,
		}),
		setWorkingHours: (context, event: { hours: TWorkingHours }) => ({
			...context,
			workingHours: event.hours,
		}),
	},
});
