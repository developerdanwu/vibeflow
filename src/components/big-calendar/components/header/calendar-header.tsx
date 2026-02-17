import { Link, useNavigate } from "@tanstack/react-router";
import { addDays, addMonths, subDays, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarViewPopover } from "@/components/big-calendar/components/header/calendar-view-popover";
import { DateNavigator } from "@/components/big-calendar/components/header/date-navigator";
import { dayRangeToDayCount } from "@/components/big-calendar/helpers";
import type { TEvent } from "@/components/big-calendar/interfaces";
import type { TCalendarView, TDayRange } from "@/components/big-calendar/types";
import { Button } from "@/components/ui/button";

interface IProps {
	dayRange: TDayRange;
	events: TEvent[];
	onViewChange?: (view: TCalendarView) => void;
}

export function CalendarHeader({ dayRange, events }: IProps) {
	const navigate = useNavigate();

	const handleToday = () =>
		navigate({
			to: "/calendar",
			search: (prev) => ({ ...prev, date: new Date() }),
		});

	const stepDays = dayRangeToDayCount(dayRange);
	const stepByDays = stepDays !== null;

	return (
		<div className="flex w-full items-center justify-between gap-2 px-3 pt-2 pb-3">
			<DateNavigator dayRange={dayRange} events={events} />
			<div className="flex flex-wrap items-center gap-1">
				<Button variant="ghost" size="icon-sm" onClick={handleToday}>
					T
				</Button>
				<Link
					from="/calendar/"
					search={(prev) => ({
						...prev,
						date: stepByDays
							? subDays(prev.date, stepDays)
							: subMonths(prev.date, 1),
					})}
				>
					<Button variant="ghost" size="icon-sm">
						<ChevronLeft />
					</Button>
				</Link>
				<Link
					from="/calendar/"
					search={(prev) => ({
						...prev,
						date: stepByDays
							? addDays(prev.date, stepDays)
							: addMonths(prev.date, 1),
					})}
				>
					<Button variant="ghost" size="icon-sm">
						<ChevronRight />
					</Button>
				</Link>
				<CalendarViewPopover />
			</div>
		</div>
	);
}
