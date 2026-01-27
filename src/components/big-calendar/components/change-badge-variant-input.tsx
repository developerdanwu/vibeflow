"use client";

import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import type { TBadgeVariant } from "@/components/big-calendar/types";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function ChangeBadgeVariantInput() {
	const [badgeVariant, store] = useCalendar((s) => s.context.badgeVariant);

	return (
		<div className="space-y-2">
			<p className="font-semibold text-sm">Change badge variant</p>

			<Select
				value={badgeVariant}
				onValueChange={(variant) =>
					store.send({
						type: "setBadgeVariant",
						variant: variant as TBadgeVariant,
					})
				}
			>
				<SelectTrigger className="w-48">
					<SelectValue />
				</SelectTrigger>

				<SelectContent>
					<SelectItem value="dot">Dot</SelectItem>
					<SelectItem value="colored">Colored</SelectItem>
					<SelectItem value="mixed">Mixed</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
