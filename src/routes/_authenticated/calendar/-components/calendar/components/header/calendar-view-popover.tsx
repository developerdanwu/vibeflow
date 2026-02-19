import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Route } from "@/routes/_authenticated/calendar/index";
import type {
	TCalendarView,
	TDayRange,
} from "@/routes/_authenticated/calendar/-components/calendar/core/types";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

const RANGE_OPTIONS: { value: TDayRange; label: string }[] = [
	{ value: "1", label: "1" },
	{ value: "2", label: "2" },
	{ value: "3", label: "3" },
	{ value: "4", label: "4" },
	{ value: "5", label: "5" },
	{ value: "6", label: "6" },
	{ value: "W", label: "W" },
	{ value: "M", label: "M" },
];

export function CalendarViewPopover() {
	const navigate = useNavigate();
	const { view, dayRange } = Route.useSearch();

	const setView = (next: TCalendarView) => {
		navigate({
			to: "/calendar",
			search: (prev) => ({ ...prev, view: next }),
		});
	};

	const setDayRange = (next: TDayRange) => {
		navigate({
			to: "/calendar",
			search: (prev) => ({ ...prev, dayRange: next }),
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
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between gap-4">
						<span className="font-medium text-xs">View</span>
						<ToggleGroup
							variant="outline"
							size="xs"
							spacing={0}
							value={[view]}
							onValueChange={(v) => {
								const next = v?.[0] as TCalendarView | undefined;
								if (next) setView(next);
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
						<span className="font-medium text-xs">Range</span>
						<ToggleGroup
							variant="outline"
							size="xs"
							spacing={0}
							value={[dayRange]}
							onValueChange={(v) => {
								const next = v?.[0] as TDayRange | undefined;
								if (next) setDayRange(next);
							}}
						>
							{RANGE_OPTIONS.map(({ value, label }) => (
								<ToggleGroupItem
									key={value}
									className="w-max px-2 text-xs"
									value={value}
								>
									{label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
