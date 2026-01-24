import { createStore } from "@xstate/store";
import type { IEvent, IUser } from "@/components/big-calendar/interfaces";
import type {
	TBadgeVariant,
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

export const calendarStore = createStore({
	context: {
		selectedDate: new Date(),
		selectedUserId: "all" as IUser["id"] | "all",
		badgeVariant: "colored" as TBadgeVariant,
		visibleHours: VISIBLE_HOURS,
		workingHours: WORKING_HOURS,
		events: [] as IEvent[],
		users: [] as IUser[],
	},
	on: {
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
	},
});
