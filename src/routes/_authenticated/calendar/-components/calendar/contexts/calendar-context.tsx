import type { ReactNode } from "react";

export function CalendarProvider({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

export { useCalendar } from "@/routes/_authenticated/calendar/-components/calendar/store/calendar-store";
