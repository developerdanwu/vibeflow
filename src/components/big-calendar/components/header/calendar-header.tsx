import { Plus } from "lucide-react";
import { AddEventDialog } from "@/components/big-calendar/components/dialogs/add-event-dialog";
import { DateNavigator } from "@/components/big-calendar/components/header/date-navigator";
import { TodayButton } from "@/components/big-calendar/components/header/today-button";
import { UserSelect } from "@/components/big-calendar/components/header/user-select";
import type { IEvent } from "@/components/big-calendar/interfaces";
import type { TCalendarView } from "@/components/big-calendar/types";
import { Button } from "@/components/ui/button";

interface IProps {
	view: TCalendarView;
	events: IEvent[];
	onViewChange?: (view: TCalendarView) => void;
}

export function CalendarHeader({ view, events, onViewChange }: IProps) {
	return (
		<div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
			<div className="flex items-center gap-3">
				<TodayButton />
				<DateNavigator view={view} events={events} />
			</div>

			<div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
				<div className="flex w-full items-center gap-1.5">
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => onViewChange?.("day")}
							className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
								view === "day"
									? "bg-primary text-primary-foreground"
									: "bg-secondary/20 hover:bg-secondary/30"
							}`}
						>
							Day
						</button>
						<button
							type="button"
							onClick={() => onViewChange?.("week")}
							className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
								view === "week"
									? "bg-primary text-primary-foreground"
									: "bg-secondary/20 hover:bg-secondary/30"
							}`}
						>
							Week
						</button>
						<button
							type="button"
							onClick={() => onViewChange?.("month")}
							className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
								view === "month"
									? "bg-primary text-primary-foreground"
									: "bg-secondary/20 hover:bg-secondary/30"
							}`}
						>
							Month
						</button>
						<button
							type="button"
							onClick={() => onViewChange?.("year")}
							className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
								view === "year"
									? "bg-primary text-primary-foreground"
									: "bg-secondary/20 hover:bg-secondary/30"
							}`}
						>
							Year
						</button>
						<button
							type="button"
							onClick={() => onViewChange?.("agenda")}
							className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
								view === "agenda"
									? "bg-primary text-primary-foreground"
									: "bg-secondary/20 hover:bg-secondary/30"
							}`}
						>
							Agenda
						</button>
					</div>

					<UserSelect />
				</div>

				<AddEventDialog>
					<Button className="w-full sm:w-auto">
						<Plus />
						Add Event
					</Button>
				</AddEventDialog>
			</div>
		</div>
	);
}
