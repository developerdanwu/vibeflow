"use client";

import { useSelector } from "@xstate/store/react";
import { createContext, type ReactNode, useContext } from "react";
import type { IEvent, IUser } from "@/components/big-calendar/interfaces";
import { calendarStore } from "@/components/big-calendar/store/calendarStore";
import type {
	TBadgeVariant,
	TVisibleHours,
	TWorkingHours,
} from "@/components/big-calendar/types";

interface ICalendarContext {
	selectedDate: Date;
	setSelectedDate: (date: Date | undefined) => void;
	selectedUserId: IUser["id"] | "all";
	setSelectedUserId: (userId: IUser["id"] | "all") => void;
	badgeVariant: TBadgeVariant;
	setBadgeVariant: (variant: TBadgeVariant) => void;
	users: IUser[];
	workingHours: TWorkingHours;
	setWorkingHours: (hours: TWorkingHours) => void;
	visibleHours: TVisibleHours;
	setVisibleHours: (hours: TVisibleHours) => void;
	events: IEvent[];
	setLocalEvents: (events: IEvent[]) => void;
}

const CalendarContext = createContext({} as ICalendarContext);

export function CalendarProvider({
	children,
	users = [],
	events = [],
}: {
	children: ReactNode;
	users?: IUser[];
	events?: IEvent[];
}) {
	if (users.length > 0) {
		calendarStore.send({ type: "setUsers", users });
	}
	if (events.length > 0) {
		calendarStore.send({ type: "setEvents", events });
	}

	const selectedDate = useSelector(
		calendarStore,
		(state) => state.context.selectedDate,
	);
	const selectedUserId = useSelector(
		calendarStore,
		(state) => state.context.selectedUserId,
	);
	const badgeVariant = useSelector(
		calendarStore,
		(state) => state.context.badgeVariant,
	);
	const storeUsers = useSelector(calendarStore, (state) => state.context.users);
	const visibleHours = useSelector(
		calendarStore,
		(state) => state.context.visibleHours,
	);
	const workingHours = useSelector(
		calendarStore,
		(state) => state.context.workingHours,
	);
	const storeEvents = useSelector(
		calendarStore,
		(state) => state.context.events,
	);

	const handleSelectDate = (date: Date | undefined) => {
		if (!date) return;
		calendarStore.send({ type: "setSelectedDate", date });
	};

	const value: ICalendarContext = {
		selectedDate,
		setSelectedDate: handleSelectDate,
		selectedUserId,
		setSelectedUserId: (userId) =>
			calendarStore.send({ type: "setSelectedUserId", userId }),
		badgeVariant,
		setBadgeVariant: (variant) =>
			calendarStore.send({ type: "setBadgeVariant", variant }),
		users: storeUsers.length > 0 ? storeUsers : users,
		visibleHours,
		setVisibleHours: (hours) =>
			calendarStore.send({ type: "setVisibleHours", hours }),
		workingHours,
		setWorkingHours: (hours) =>
			calendarStore.send({ type: "setWorkingHours", hours }),
		events: storeEvents.length > 0 ? storeEvents : events,
		setLocalEvents: (events) =>
			calendarStore.send({ type: "setEvents", events }),
	};

	return (
		<CalendarContext.Provider value={value}>
			{children}
		</CalendarContext.Provider>
	);
}

export function useCalendar(): ICalendarContext {
	const context = useContext(CalendarContext);
	if (!context)
		throw new Error("useCalendar must be used within a CalendarProvider.");
	return context;
}
