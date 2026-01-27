import { formatDate } from "date-fns";

import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";

export function TodayButton() {
	const [, store] = useCalendar();

	const today = new Date();
	const handleClick = () =>
		store.send({ type: "setSelectedDate", date: today });

	return (
		<button
			className="flex size-14 flex-col items-start overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
			onClick={handleClick}
		>
			<p className="flex h-6 w-full items-center justify-center bg-primary text-center font-semibold text-primary-foreground text-xs">
				{formatDate(today, "MMM").toUpperCase()}
			</p>
			<p className="flex w-full items-center justify-center font-bold text-lg">
				{today.getDate()}
			</p>
		</button>
	);
}
