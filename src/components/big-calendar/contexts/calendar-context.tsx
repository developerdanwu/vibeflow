"use client";

import type { ReactNode } from "react";
import type { IEvent, IUser } from "@/components/big-calendar/interfaces";
import { useCalendar } from "@/components/big-calendar/store/calendarStore";

export function CalendarProvider({
	children,
	users = [],
	events = [],
}: {
	children: ReactNode;
	users?: IUser[];
	events?: IEvent[];
}) {
	const [, store] = useCalendar();

	if (users.length > 0) {
		store.send({ type: "setUsers", users });
	}
	if (events.length > 0) {
		store.send({ type: "setEvents", events });
	}

	return <>{children}</>;
}

export { useCalendar } from "@/components/big-calendar/store/calendarStore";
