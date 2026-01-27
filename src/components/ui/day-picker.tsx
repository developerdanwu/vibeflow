"use client";

import { formatDate } from "date-fns";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DayPicker({
	label,
	date,
	setDate,
	dateFormat = "MMM d, yyyy",
	fieldClassName,
	buttonProps,
}: {
	dateFormat?: string;
	label?: string;
	date: Date;
	setDate: (date: Date | undefined) => void;
	fieldClassName?: string;
	buttonProps?: React.ComponentProps<typeof Button>;
}) {
	const { className: buttonClassName, ...restButtonProps } = buttonProps ?? {};
	const [open, setOpen] = React.useState(false);
	const id = React.useId();

	return (
		<Field className={cn("mx-auto w-44", fieldClassName)}>
			{label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={
						<Button
							variant="outline"
							id={id}
							className={cn("justify-start font-normal", buttonClassName)}
							{...restButtonProps}
						>
							{date ? formatDate(date, dateFormat) : "Select date"}
						</Button>
					}
				/>
				<PopoverContent className="w-auto overflow-hidden p-0" align="start">
					<Calendar
						mode="single"
						selected={date}
						defaultMonth={date}
						captionLayout="dropdown"
						onSelect={(date) => {
							setDate(date);
							setOpen(false);
						}}
					/>
				</PopoverContent>
			</Popover>
		</Field>
	);
}
