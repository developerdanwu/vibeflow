import type { TCalendarView } from "@/components/big-calendar/types";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Route } from "@/routes/_authenticated/calendar";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

type ViewType = "calendar" | "agenda";
type CalendarDuration = "day" | "month";
type AgendaDuration = "3" | "7" | "14" | "month";

function viewTypeFromUrl(view: TCalendarView): ViewType {
	return view === "agenda" ? "agenda" : "calendar";
}

function calendarDurationFromUrl(view: TCalendarView): CalendarDuration {
	return view === "day" ? "day" : "month";
}

export function CalendarViewPopover() {
	const navigate = useNavigate();
	const { view, agendaRange } = Route.useSearch();

	const viewType = viewTypeFromUrl(view);
	const calendarDuration = calendarDurationFromUrl(view);
	const agendaDuration: AgendaDuration =
		agendaRange === "3" || agendaRange === "7" || agendaRange === "14"
			? agendaRange
			: "month";

	const setViewType = (next: ViewType) => {
		if (next === "agenda") {
			navigate({
				to: "/calendar",
				search: (prev) => ({
					...prev,
					view: "agenda",
					agendaRange: prev.agendaRange ?? "7",
				}),
			});
		} else {
			navigate({
				to: "/calendar",
				search: (prev) => ({
					...prev,
					view: "month",
				}),
			});
		}
	};

	const setCalendarDuration = (next: CalendarDuration) => {
		navigate({
			to: "/calendar",
			search: (prev) => ({ ...prev, view: next }),
		});
	};

	const setAgendaDuration = (next: AgendaDuration) => {
		navigate({
			to: "/calendar",
			search: (prev) => ({
				...prev,
				view: "agenda",
				agendaRange: next,
			}),
		});
	};

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button variant="ghost" size="icon-sm" title="View options">
						<CalendarDays className="size-4" />
					</Button>
				}
			/>
			<PopoverContent align="end" className="w-72">
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between gap-4">
						<span className="font-medium text-xs">View</span>
						<ToggleGroup
							variant="outline"
							size="xs"
							spacing={0}
							value={[viewType]}
							onValueChange={(v) => {
								const next = v?.[0] as ViewType | undefined;
								if (next) setViewType(next);
							}}
						>
							<ToggleGroupItem className="w-max text-xs" value="calendar">
								Calendar
							</ToggleGroupItem>
							<ToggleGroupItem className="w-max text-xs" value="agenda">
								Agenda
							</ToggleGroupItem>
						</ToggleGroup>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="font-medium text-xs">Duration</span>
						{viewType === "calendar" ? (
							<ToggleGroup
								variant="outline"
								size="xs"
								spacing={0}
								value={[calendarDuration]}
								onValueChange={(v) => {
									const next = v?.[0] as CalendarDuration | undefined;
									if (next) setCalendarDuration(next);
								}}
							>
								<ToggleGroupItem className="w-max text-xs" value="day">
									Day
								</ToggleGroupItem>
								<ToggleGroupItem className="w-max text-xs" value="month">
									Month
								</ToggleGroupItem>
							</ToggleGroup>
						) : (
							<ToggleGroup
								variant="outline"
								size="xs"
								spacing={0}
								value={[agendaDuration]}
								onValueChange={(v) => {
									const next = v?.[0] as AgendaDuration | undefined;
									if (next) setAgendaDuration(next);
								}}
							>
								<ToggleGroupItem value="3" className="px-2 text-xs">
									3
								</ToggleGroupItem>
								<ToggleGroupItem value="7" className="px-2 text-xs">
									7
								</ToggleGroupItem>
								<ToggleGroupItem value="14" className="px-2 text-xs">
									14
								</ToggleGroupItem>
								<ToggleGroupItem value="month" className="px-2 text-xs">
									M
								</ToggleGroupItem>
							</ToggleGroup>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
