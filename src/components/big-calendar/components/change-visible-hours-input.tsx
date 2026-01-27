"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import type { TimeValue } from "react-aria-components";
import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import { Button } from "@/components/ui/button";
import { TimeInput } from "@/components/ui/time-input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChangeVisibleHoursInput() {
	const [visibleHours, store] = useCalendar((s) => s.context.visibleHours);

	const [from, setFrom] = useState<{ hour: number; minute: number }>({
		hour: visibleHours.from,
		minute: 0,
	});
	const [to, setTo] = useState<{ hour: number; minute: number }>({
		hour: visibleHours.to,
		minute: 0,
	});

	const handleApply = () => {
		const toHour = to.hour === 0 ? 24 : to.hour;
		store.send({
			type: "setVisibleHours",
			hours: { from: from.hour, to: toHour },
		});
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<p className="font-semibold text-sm">Change visible hours</p>

				<TooltipProvider delayDuration={100}>
					<Tooltip>
						<TooltipTrigger>
							<Info className="size-3" />
						</TooltipTrigger>

						<TooltipContent className="max-w-80 text-center">
							<p>
								If an event falls outside the specified visible hours, the
								visible hours will automatically adjust to include that event.
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			<div className="flex items-center gap-4">
				<p>From</p>
				<TimeInput
					id="start-time"
					hourCycle={12}
					granularity="hour"
					value={from as TimeValue}
					onChange={setFrom as (value: TimeValue | null) => void}
				/>
				<p>To</p>
				<TimeInput
					id="end-time"
					hourCycle={12}
					granularity="hour"
					value={to as TimeValue}
					onChange={setTo as (value: TimeValue | null) => void}
				/>
			</div>

			<Button className="mt-4 w-fit" onClick={handleApply}>
				Apply
			</Button>
		</div>
	);
}
