"use client";

import type { ReactNode } from "react";

export function CalendarProvider({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

export { useCalendar } from "@/components/big-calendar/store/calendarStore";
