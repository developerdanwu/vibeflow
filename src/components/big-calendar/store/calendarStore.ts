import type { Time } from "@internationalized/date";
import { createStoreHook } from "@xstate/store-react";
import type { IEvent, IUser } from "@/components/big-calendar/interfaces";
import type {
	TBadgeVariant,
	TDensity,
	TVisibleHours,
	TWorkingHours,
} from "@/components/big-calendar/types";

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
		selectedDate: new Date(),
		selectedUserId: "all" as IUser["id"] | "all",
		badgeVariant: "colored" as TBadgeVariant,
		density: "small" as TDensity,
		showWeekends: true,
		showDeclinedEvents: true,
		showDoneTasks: true,
		visibleHours: VISIBLE_HOURS,
		workingHours: WORKING_HOURS,
		events: [] as IEvent[],
		users: [] as IUser[],
		newEventTitle: "",
		newEventStartTime: null as Time | null | undefined,
		newEventAllDay: true as boolean | undefined,
	},
	on: {
		setNewEventStartTime: (
			context,
			event: { startTime: Time | null | undefined },
		) => ({
			...context,
			newEventStartTime: event.startTime,
		}),
		setNewEventAllDay: (context, event: { allDay: boolean | undefined }) => ({
			...context,
			newEventAllDay: event.allDay,
		}),
		setNewEventTitle: (context, event: { title: string }) => ({
			...context,
			newEventTitle: event.title,
		}),
		setSelectedDate: (context, event: { date: Date }) => ({
			...context,
			selectedDate: event.date,
		}),
		setSelectedUserId: (context, event: { userId: IUser["id"] | "all" }) => ({
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
		setEvents: (context, event: { events: IEvent[] }) => ({
			...context,
			events: event.events,
		}),
		updateEvent: (context, event: { updatedEvent: IEvent }) => ({
			...context,
			events: context.events.map((e) =>
				e.id === event.updatedEvent.id ? event.updatedEvent : e,
			),
		}),
		addEvent: (context, event: { newEvent: IEvent }) => ({
			...context,
			events: [...context.events, event.newEvent],
		}),
		deleteEvent: (context, event: { eventId: number }) => ({
			...context,
			events: context.events.filter((e) => e.id !== event.eventId),
		}),
		setUsers: (context, event: { users: IUser[] }) => ({
			...context,
			users: event.users,
		}),
		setDensity: (context, event: { density: TDensity }) => ({
			...context,
			density: event.density,
		}),
		setShowWeekends: (context, event: { show: boolean }) => ({
			...context,
			showWeekends: event.show,
		}),
		setShowDeclinedEvents: (context, event: { show: boolean }) => ({
			...context,
			showDeclinedEvents: event.show,
		}),
		setShowDoneTasks: (context, event: { show: boolean }) => ({
			...context,
			showDoneTasks: event.show,
		}),
	},
});
