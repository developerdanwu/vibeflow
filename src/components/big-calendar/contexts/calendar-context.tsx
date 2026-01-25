"use client";

import type { IEvent, IUser } from "@/components/big-calendar/interfaces";
import { calendarStore } from "@/components/big-calendar/store/calendarStore";
import type {
	TBadgeVariant,
	TDensity,
	TVisibleHours,
	TWorkingHours,
} from "@/components/big-calendar/types";
import { useSelector } from "@xstate/store-react";
import { createContext, type ReactNode, useContext } from "react";

interface ICalendarContext {
	selectedDate: Date;
	setSelectedDate: (date: Date | undefined) => void;
	selectedUserId: IUser["id"] | "all";
	setSelectedUserId: (userId: IUser["id"] | "all") => void;
	badgeVariant: TBadgeVariant;
	setBadgeVariant: (variant: TBadgeVariant) => void;
	density: TDensity;
	setDensity: (density: TDensity) => void;
	showWeekends: boolean;
	setShowWeekends: (show: boolean) => void;
	showDeclinedEvents: boolean;
	setShowDeclinedEvents: (show: boolean) => void;
	showDoneTasks: boolean;
	setShowDoneTasks: (show: boolean) => void;
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
	const density = useSelector(
		calendarStore,
		(state) => state.context.density,
	);
	const showWeekends = useSelector(
		calendarStore,
		(state) => state.context.showWeekends,
	);
	const showDeclinedEvents = useSelector(
		calendarStore,
		(state) => state.context.showDeclinedEvents,
	);
	const showDoneTasks = useSelector(
		calendarStore,
		(state) => state.context.showDoneTasks,
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
		density,
		setDensity: (density) =>
			calendarStore.send({ type: "setDensity", density }),
		showWeekends,
		setShowWeekends: (show) =>
			calendarStore.send({ type: "setShowWeekends", show }),
		showDeclinedEvents,
		setShowDeclinedEvents: (show) =>
			calendarStore.send({ type: "setShowDeclinedEvents", show }),
		showDoneTasks,
		setShowDoneTasks: (show) =>
			calendarStore.send({ type: "setShowDoneTasks", show }),
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
