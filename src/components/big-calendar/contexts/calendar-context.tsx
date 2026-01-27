"use client";

import { type ReactNode, useEffect } from "react";
import { useCalendar } from "@/components/big-calendar/store/calendarStore";

export function CalendarProvider({
	children,
	initialDate,
}: {
	children: ReactNode;
	initialDate: Date;
}) {
	const [, store] = useCalendar();
	useEffect(() => {
		store.send({ type: "setSelectedDate", date: initialDate });
	}, [initialDate, store]);

	return <>{children}</>;
}

export { useCalendar } from "@/components/big-calendar/store/calendarStore";
