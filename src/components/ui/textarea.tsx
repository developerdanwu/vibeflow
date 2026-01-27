import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
	"field-sizing-content flex min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80",
	{
		variants: {
			variant: {
				default: "",
				ghost:
					"border-0 bg-transparent hover:bg-accent/50 focus-visible:border-0 focus-visible:bg-accent/50 focus-visible:ring-0 dark:bg-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Textarea({
	className,
	variant = "default",
	...props
}: ComponentPropsWithoutRef<"textarea"> &
	VariantProps<typeof textareaVariants>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(textareaVariants({ variant, className }))}
			{...props}
		/>
	);
}

export { Textarea };
