import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import type { TimeFieldProps, TimeValue } from "react-aria-components";
import { DateInput, DateSegment, TimeField } from "react-aria-components";
import { cn } from "@/lib/utils";

// ================================== //

const timeInputVariants = cva(
	"peer inline-flex w-full items-center gap-0.5 overflow-hidden whitespace-nowrap rounded-md border bg-background shadow-black data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[focus-within]:outline-none data-[focus-within]:ring-1 data-[focus-within]:ring-ring",
	{
		variants: {
			size: {
				default: "h-9 px-3 py-2 text-sm",
				xs: "h-6 px-2 py-0.5 text-xs",
				"2xs": "h-5 px-1.5 py-0.5 text-2xs",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

type TTimeInputRef = HTMLDivElement;
type TTimeInputProps = Omit<
	TimeFieldProps<TimeValue>,
	"isDisabled" | "isInvalid"
> & {
	readonly dateInputClassName?: string;
	readonly segmentClassName?: string;
	readonly disabled?: boolean;
	readonly "data-invalid"?: boolean;
} & VariantProps<typeof timeInputVariants>;

const TimeInput = forwardRef<TTimeInputRef, TTimeInputProps>(
	(
		{
			className,
			dateInputClassName,
			segmentClassName,
			disabled,
			"data-invalid": dataInvalid,
			size = "default",
			...props
		},
		ref,
	) => {
		return (
			<TimeField
				ref={ref}
				className={cn("relative", className)}
				isDisabled={disabled}
				isInvalid={dataInvalid}
				{...props}
				aria-label="Time"
				shouldForceLeadingZeros
			>
				<DateInput
					className={cn(timeInputVariants({ size }), dateInputClassName)}
				>
					{(segment) => (
						<DateSegment
							segment={segment}
							className={cn(
								"inline rounded caret-transparent outline-0",
								"data-[focused]:bg-foreground/10 data-[focused]:text-foreground",
								"data-[placeholder]:text-muted-foreground",
								"data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
								segmentClassName,
							)}
						/>
					)}
				</DateInput>
			</TimeField>
		);
	},
);

TimeInput.displayName = "TimeInput";

// ================================== //

export { TimeInput };
