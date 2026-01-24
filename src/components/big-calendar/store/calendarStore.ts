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

interface CalendarState {
	selectedDate: Date;
	selectedUserId: IUser["id"] | "all";
	badgeVariant: TBadgeVariant;
	visibleHours: TVisibleHours;
	workingHours: TWorkingHours;
	events: IEvent[];
	users: IUser[];
}

export const calendarStore = createStore(
	{
		selectedDate: new Date(),
		selectedUserId: "all" as IUser["id"] | "all",
		badgeVariant: "colored" as TBadgeVariant,
		visibleHours: VISIBLE_HOURS,
		workingHours: WORKING_HOURS,
		events: [] as IEvent[],
		users: [] as IUser[],
	},
	{
		setSelectedDate: (context: CalendarState, event: { date: Date }) => ({
			...context,
			selectedDate: date,
		}),

		setSelectedUserId: (context, userId: IUser["id"] | "all") => ({
			...context,
			selectedUserId: userId,
		}),

		setBadgeVariant: (context, variant: TBadgeVariant) => ({
			...context,
			badgeVariant: variant,
		}),

		setVisibleHours: (context, hours: TVisibleHours) => ({
			...context,
			visibleHours: hours,
		}),

		setWorkingHours: (context, hours: TWorkingHours) => ({
			...context,
			workingHours: hours,
		}),

		setEvents: (context, events: IEvent[]) => ({
			...context,
			events,
		}),

		updateEvent: (context, updatedEvent: IEvent) => ({
			...context,
			events: context.events.map((event) =>
				event.id === updatedEvent.id ? updatedEvent : event,
			),
		}),

		addEvent: (context, newEvent: IEvent) => ({
			...context,
			events: [...context.events, newEvent],
		}),

		deleteEvent: (context, eventId: number) => ({
			...context,
			events: context.events.filter((event) => event.id !== eventId),
		}),

		setUsers: (context, users: IUser[]) => ({
			...context,
			users,
		}),
	},
);
